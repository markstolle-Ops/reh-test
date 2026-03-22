import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { sql } from "drizzle-orm";
import { db } from "@/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeChunkRow extends Record<string, unknown> {
  id: string;
  content: string;
  source: string;
  state: string | null;
  similarity: number;
}

// ─── queryKnowledgeBase ───────────────────────────────────────────────────────

/**
 * Embeds the query text and performs a cosine similarity search over the
 * knowledge_chunks table using the match_documents pgvector function.
 *
 * Returns concatenated content strings from the top matching chunks,
 * or an empty string if no matches are found or if embedding fails.
 *
 * @param query      - The user's query text to embed and search
 * @param state      - Optional state code to filter results (e.g. "CA", "TX")
 * @returns          - Concatenated chunk content strings, newline-separated
 */
export async function queryKnowledgeBase(
  query: string,
  state?: string
): Promise<string> {
  let embedding: number[];

  try {
    const result = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });
    embedding = result.embedding;
  } catch (err) {
    console.warn("[RAG] embed() failed — returning empty context:", err);
    return "";
  }

  try {
    const embeddingLiteral = `[${embedding.join(",")}]`;

    // Build the match_documents call with optional state filter
    const rows = await db.execute<KnowledgeChunkRow>(sql`
      SELECT id, content, source, state, similarity
      FROM match_documents(
        ${embeddingLiteral}::vector(1536),
        0.7,
        5,
        ${state ?? null}
      )
    `);

    if (!rows || rows.length === 0) {
      return "";
    }

    return rows.map((row) => row.content).join("\n\n");
  } catch (err) {
    console.warn("[RAG] match_documents query failed — returning empty context:", err);
    return "";
  }
}
