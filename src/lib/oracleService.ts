// src/lib/oracleService.ts
// Local QVAC oracle service — runs inference directly on-device using QVAC SDK.
//
// Memory Management (Model Swapping):
//   HP Android OOM jika EmbeddingGemma (300M) + Llama 3.2 (1B) di-RAM bersamaan.
//   Strategi: Load Embedding → Operasi RAG → Unload Embedding → Load LLM → Inference → Unload LLM.
//   Setiap model di-unload eksplisit sebelum model lain dimuat.

import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";
import {
  ensureRagIngested,
  searchFifaLaws,
  buildRagContext,
} from "./ragService";
import type { IngestProgressCallback } from "./ragService";

// ─── LLM Model State ───────────────────────────────────────────────────────
let cachedModelId: string | null = null;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface OracleOdds {
  oddsYes: number;
  oddsNo: number;
  rawResponse?: string;
}

export interface GenerateOddsOptions {
  onProgress?: IngestProgressCallback;
}

// ─── Fallback System Prompt (used when RAG is unavailable) ─────────────────
const FALLBACK_SYSTEM_PROMPT =
  "You are an expert FIFA VAR Referee and Bookmaker Odds Calculator. " +
  "RULES (FIFA VAR Protocol): " +
  "1. Penalty Kicks: Fouls inside the box or unnatural handballs are penalties (High YES odds). " +
  "2. Red Cards: DOGSO or serious foul play results in a red card (High YES odds). " +
  "3. Goals: Offside or handball in the buildup invalidates a goal (High YES odds for reversal). " +
  "4. Diving: Minimal contact where the attacker initiates the fall is not a penalty (Low YES odds, High NO odds). " +
  "TASK: Analyze the user's incidentDescription. Calculate betting odds " +
  "(High probability = low multiplier 1.2-1.8; Low probability = high multiplier 2.5-5.0). " +
  "OUTPUT: You MUST return ONLY a raw, valid JSON object in this exact format: " +
  '{"oddsYes": 1.5, "oddsNo": 2.8}. NO markdown, NO text, NO explanation.';

// ─── RAG System Prompt Template ────────────────────────────────────────────
function _buildRagSystemPrompt(ragContext: string): string {
  return (
    "You are an expert FIFA VAR Referee and Bookmaker Odds Calculator.\n" +
    "Analyze the incident using ONLY the following retrieved FIFA Laws of the Game:\n\n" +
    "<RETRIEVED_RULES>\n" +
    ragContext +
    "\n</RETRIEVED_RULES>\n\n" +
    "TASK: Based on these exact rules, calculate fair betting odds for the incident the user describes.\n" +
    "- Outcome that ALIGNS with the rules = high probability = LOW multiplier (1.2 - 1.8)\n" +
    "- Outcome that CONTRASTS the rules = low probability = HIGH multiplier (2.5 - 5.0)\n\n" +
    "OUTPUT: You MUST return ONLY a raw, valid JSON object in this exact format: " +
    '{"oddsYes": 1.5, "oddsNo": 2.8}\n' +
    "NO markdown, NO text, NO explanation, NO additional characters."
  );
}

// ─── Internal Helpers ──────────────────────────────────────────────────────

async function _unloadLLMSafe(): Promise<void> {
  if (!cachedModelId) return;
  try {
    await unloadModel({ modelId: cachedModelId });
  } catch {
    // Model may not be loaded — non-critical
  }
  cachedModelId = null;
}

function _parseOddsResponse(aiResponse: string): { oddsYes: number; oddsNo: number } {
  let parsedOdds: { oddsYes: number; oddsNo: number } | null = null;

  try {
    parsedOdds = JSON.parse(aiResponse.trim());
  } catch {
    const jsonMatch = aiResponse.match(/\{[^}]*"oddsYes"[^}]*\}/);
    if (jsonMatch) {
      try {
        parsedOdds = JSON.parse(jsonMatch[0]);
      } catch { /* ignore */ }
    }

    if (!parsedOdds || typeof parsedOdds.oddsYes !== "number" || typeof parsedOdds.oddsNo !== "number") {
      const yesMatch = aiResponse.match(/"oddsYes"\s*:\s*(\d+(?:\.\d+)?)/i);
      const noMatch = aiResponse.match(/"oddsNo"\s*:\s*(\d+(?:\.\d+)?)/i);
      if (yesMatch && noMatch) {
        parsedOdds = {
          oddsYes: parseFloat(yesMatch[1]),
          oddsNo: parseFloat(noMatch[1]),
        };
      }
    }
  }

  if (
    !parsedOdds ||
    typeof parsedOdds.oddsYes !== "number" ||
    typeof parsedOdds.oddsNo !== "number" ||
    isNaN(parsedOdds.oddsYes) ||
    isNaN(parsedOdds.oddsNo)
  ) {
    throw new Error(`Failed to parse valid odds from AI response: ${aiResponse}`);
  }

  return parsedOdds;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Generates betting odds for a given VAR incident description
 * using RAG-augmented local LLM inference via QVAC SDK.
 *
 * Model Swapping Flow (OOM Prevention):
 *   1. Unload LLM (free RAM)
 *   2. RAG: Load Embedding → Ingest/Search → Unload Embedding
 *   3. Load LLM → Completion → Unload LLM
 */
export async function generateOracleOdds(
  incidentDescription: string,
  options?: GenerateOddsOptions,
): Promise<OracleOdds> {
  if (!incidentDescription || !incidentDescription.trim()) {
    throw new Error("incidentDescription is required");
  }

  // ── Phase 0: Free RAM — unload LLM before embedding model loads ─────
  await _unloadLLMSafe();

  // ── Phase 1: RAG — Load Embedding → Operate → Unload Embedding ─────
  let systemContent = FALLBACK_SYSTEM_PROMPT;
  let ragUsed = false;

  try {
    await ensureRagIngested(options?.onProgress);

    const ragResults = await searchFifaLaws(incidentDescription.trim(), 3);

    if (ragResults && ragResults.length > 0) {
      const ragContext = buildRagContext(ragResults);
      systemContent = _buildRagSystemPrompt(ragContext);
      ragUsed = true;
      console.log(`[RAG] Retrieved ${ragResults.length} laws for inference.`);
    } else {
      console.log("[RAG] No laws retrieved, using fallback hardcoded rules.");
    }
  } catch (ragErr) {
    console.warn("[RAG] RAG pipeline failed, falling back to hardcoded rules:", ragErr);
    // systemContent tetap FALLBACK_SYSTEM_PROMPT
    // Pastikan embedding model sudah unloaded (searchFifaLaws finally block handles this,
    // tapi jika error sebelum searchFifaLaws, embed mungkin masih loaded)
    // ragService internally handles unload — worst case: load LLM fails because OOM,
    // then we fallback more gracefully below
  }

  // ── Phase 2: LLM — Load → Inference → Unload ───────────────────────
  try {
    if (!cachedModelId) {
      console.log("[QVAC] Loading LLM model...");
      cachedModelId = await loadModel({
        modelId: LLAMA_3_2_1B_INST_Q4_0,
        modelType: "llm",
        onProgress: (progress: number) => {
          console.log(`[QVAC] LLM Load Progress: ${progress}%`);
        },
      } as any);
    }

    const history = [
      { role: "system", content: systemContent },
      { role: "user", content: incidentDescription.trim() },
    ];

    const run = completion({
      modelId: cachedModelId,
      history,
      stream: false,
    });

    const finalResult = await run.final;
    const aiResponse = finalResult.contentText || "";
    const parsedOdds = _parseOddsResponse(aiResponse);

    console.log(`[ORACLE] Inference complete. RAG: ${ragUsed}. YES: ${parsedOdds.oddsYes}x, NO: ${parsedOdds.oddsNo}x`);

    return {
      oddsYes: parsedOdds.oddsYes,
      oddsNo: parsedOdds.oddsNo,
      rawResponse: aiResponse,
    };
  } finally {
    // Unload LLM setiap kali — mencegah OOM untuk operasi selanjutnya
    await _unloadLLMSafe();
  }
}
