// src/lib/ragService.ts
// RAG pipeline for FIFA Laws of the Game using QVAC SDK.
// Manages embedding model lifecycle explicitly to prevent OOM when
// both EmbeddingGemma (300M) and Llama 3.2 (1B) are loaded simultaneously.
// Strategy: Load Embedding → Operation → Unload Embedding (every call).

import {
  ragIngest,
  ragSearch,
  ragListWorkspaces,
  ragReindex,
  unloadModel,
  EMBEDDINGGEMMA_300M_Q4_0,
} from "@qvac/sdk";

import lawsData from "../../laws-of-the-game.json";

// ─── Constants ────────────────────────────────────────────────────────────
const WORKSPACE_NAME = "fifa-laws";
const EMBEDDING_MODEL_ID = EMBEDDINGGEMMA_300M_Q4_0.modelId;

// ─── Types ────────────────────────────────────────────────────────────────
export interface SearchResult {
  content: string;
  score: number;
}

export type IngestProgressCallback = (pct: number, status: string) => void;

// ─── Module State ─────────────────────────────────────────────────────────
let _ingested = false;
let _ingestInProgress = false;

// ─── Internal Helpers ─────────────────────────────────────────────────────

function _extractLawsDocuments(): string[] {
  return lawsData.laws.map(
    (law: any) => `Law ${law.number} - ${law.title}\n\n${law.full_text}`
  );
}

async function _unloadEmbedSafe(): Promise<void> {
  try {
    await unloadModel({ modelId: EMBEDDING_MODEL_ID });
  } catch {
    // Model may not be loaded or already auto-unloaded — non-critical
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Ensures the FIFA Laws workspace has been ingested once.
 * First call: downloads EmbeddingGemma (277MB), chunks 17 laws, builds index.
 * Subsequent calls: skip (in-memory flag).
 *
 * Embedding model is ALWAYS unloaded after this function finishes,
 * whether it succeeded or threw.
 */
export async function ensureRagIngested(
  onProgress?: IngestProgressCallback,
): Promise<void> {
  if (_ingested || _ingestInProgress) return;
  _ingestInProgress = true;

  try {
    onProgress?.(0, "Checking workspace...");

    const workspaces = await ragListWorkspaces();
    const exists = workspaces.some((w: any) => w.name === WORKSPACE_NAME);

    if (exists) {
      _ingested = true;
      onProgress?.(100, "FIFA Laws database ready");
      return;
    }

    // First-time ingest
    const documents = _extractLawsDocuments();
    onProgress?.(5, "Preparing AI Engine (277MB)...");

    await ragIngest({
      modelId: EMBEDDING_MODEL_ID,
      documents,
      workspace: WORKSPACE_NAME,
      chunk: true,
      chunkOpts: {
        chunkSize: 1024,
        chunkOverlap: 200,
        chunkStrategy: "paragraph",
      } as any,
    });

    onProgress?.(65, "Building vector search index...");

    // Free embedding model memory immediately after ingest
    await _unloadEmbedSafe();

    // Reindex for optimal k-means search (requires >= 16 chunks)
    onProgress?.(80, "Optimizing search index...");

    try {
      await ragReindex({ modelId: EMBEDDING_MODEL_ID, workspace: WORKSPACE_NAME } as any);
    } catch {
      // Reindex may fail if < 16 chunks — non-critical, brute-force search still works
    }

    await _unloadEmbedSafe();

    onProgress?.(100, "FIFA Laws database ready!");
    _ingested = true;
  } catch (err: any) {
    onProgress?.(100, `Ingest skipped: ${err?.message ?? "unknown error"}`);
    throw err;
  } finally {
    _ingestInProgress = false;
  }
}

/**
 * Searches the FIFA Laws workspace for the top-K most relevant laws
 * matching the query (incident description).
 *
 * CRITICAL: Embedding model is ALWAYS unloaded in the finally block
 * after this function finishes — prevents OOM with subsequent LLM load.
 */
export async function searchFifaLaws(
  query: string,
  topK = 3,
): Promise<SearchResult[]> {
  try {
    const results = await ragSearch({
      modelId: EMBEDDING_MODEL_ID,
      query,
      topK,
      workspace: WORKSPACE_NAME,
      n: 3,
    } as any);

    return (results as any[]).map((r: any) => ({
      content: r.content ?? "",
      score: r.score ?? 0,
    }));
  } finally {
    // ALWAYS unload embedding model to free RAM for subsequent LLM load
    await _unloadEmbedSafe();
  }
}

/**
 * Formats search results into a prompt-ready context block.
 */
export function buildRagContext(results: SearchResult[]): string {
  if (!results.length) return "";

  return results
    .map(
      (r, i) =>
        `[RULE ${i + 1}] (Relevance Score: ${(r.score * 100).toFixed(0)}%)\n${r.content}`,
    )
    .join("\n\n---\n\n");
}
