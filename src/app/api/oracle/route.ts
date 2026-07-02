import { NextResponse } from "next/server";
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

export const maxDuration = 300; // Allow up to 5 minutes for first-run model download & load
export const dynamic = 'force-dynamic';

let cachedModelId: string | null = null;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { incidentDescription } = body;

    if (!incidentDescription || typeof incidentDescription !== "string" || !incidentDescription.trim()) {
      return NextResponse.json({ error: "incidentDescription is required" }, { status: 400 });
    }

    // a. Load model LLAMA_3_2_1B_INST_Q4_0 to memory
    if (!cachedModelId) {
      console.log("[QVAC] Initializing model, this may take a while...");
      cachedModelId = await loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0,
        modelType: "llm",
        onProgress: (progress) => {
          console.log(`[QVAC] Download/Load Progress: ${progress}%`);
        },
      });
    }

    // b. Create history array with Context Injection
    const history = [
      {
        role: "system",
        content: "You are an expert FIFA VAR Referee and Bookmaker Odds Calculator. RULES (FIFA VAR Protocol): 1. Penalty Kicks: Fouls inside the box or unnatural handballs are penalties (High YES odds). 2. Red Cards: DOGSO or serious foul play results in a red card (High YES odds). 3. Goals: Offside or handball in the buildup invalidates a goal (High YES odds for reversal). 4. Diving: Minimal contact where the attacker initiates the fall is not a penalty (Low YES odds, High NO odds). TASK: Analyze the user's incidentDescription. Calculate betting odds (High probability = low multiplier 1.2-1.8; Low probability = high multiplier 2.5-5.0). OUTPUT: You MUST return ONLY a raw, valid JSON object in this exact format: {\"oddsYes\": 1.5, \"oddsNo\": 2.8}. NO markdown, NO text, NO explanation."
      },
      {
        role: "user",
        content: incidentDescription.trim()
      }
    ];

    // c. Call completion
    const run = completion({
      modelId: cachedModelId,
      history: history,
      stream: false
    });

    const finalResult = await run.final;
    const aiResponse = finalResult.contentText || "";

    // d. Parse string with JSON.parse, fallback to regex
    let parsedOdds: { oddsYes: number; oddsNo: number } | null = null;
    try {
      parsedOdds = JSON.parse(aiResponse.trim());
    } catch (e) {
      // Regex extraction fallback
      const jsonMatch = aiResponse.match(/\{[^}]*"oddsYes"[^}]*\}/);
      if (jsonMatch) {
        try {
          parsedOdds = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          // ignore
        }
      }
      
      if (!parsedOdds || typeof parsedOdds.oddsYes !== "number" || typeof parsedOdds.oddsNo !== "number") {
        const yesMatch = aiResponse.match(/"oddsYes"\s*:\s*(\d+(?:\.\d+)?)/i);
        const noMatch = aiResponse.match(/"oddsNo"\s*:\s*(\d+(?:\.\d+)?)/i);
        if (yesMatch && noMatch) {
          parsedOdds = {
            oddsYes: parseFloat(yesMatch[1]),
            oddsNo: parseFloat(noMatch[1])
          };
        }
      }
    }

    if (!parsedOdds || typeof parsedOdds.oddsYes !== "number" || typeof parsedOdds.oddsNo !== "number" || isNaN(parsedOdds.oddsYes) || isNaN(parsedOdds.oddsNo)) {
      throw new Error(`Failed to parse valid odds from AI response: ${aiResponse}`);
    }

    return NextResponse.json({
      oddsYes: parsedOdds.oddsYes,
      oddsNo: parsedOdds.oddsNo,
      rawResponse: aiResponse
    });

  } catch (error: any) {
    console.error("Oracle API Route Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // Model is cached globally, do not unload to prevent HMR and repeated cold starts
  }
}
