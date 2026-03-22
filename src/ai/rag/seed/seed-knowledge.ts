/**
 * Knowledge base seeding script.
 * Reads legal/compliance docs, chunks them, embeds via text-embedding-3-small,
 * and inserts into the knowledge_chunks table.
 *
 * Usage: npx tsx src/ai/rag/seed/seed-knowledge.ts
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable set
 *   - OPENAI_API_KEY environment variable set
 *   - pgvector migration (001_pgvector.sql) already applied to database
 */

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { and, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import * as fs from "fs";
import * as path from "path";
import postgres from "postgres";
import { knowledgeChunks } from "@/db/schema";

// ─── Source documents ─────────────────────────────────────────────────────────

const DOCS_TO_SEED = [
  {
    path: path.resolve(process.cwd(), "docs/legal/ai-guidance-taxonomy.md"),
    source: "ai-guidance-taxonomy",
    state: null, // applies to all states
  },
  {
    path: path.resolve(process.cwd(), "docs/legal/upl-guardrail-document.md"),
    source: "upl-guardrail-document",
    state: null,
  },
  {
    path: path.resolve(process.cwd(), "docs/legal/state-compliance-classification.md"),
    source: "state-compliance-classification",
    state: null,
  },
];

// ─── Chunk helpers ────────────────────────────────────────────────────────────

const CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;
// Rough approximation: 1 token ~ 4 characters
const CHARS_PER_CHUNK = CHUNK_TOKENS * 4;
const CHARS_OVERLAP = OVERLAP_TOKENS * 4;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + CHARS_PER_CHUNK, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - CHARS_OVERLAP;
  }

  return chunks.filter((c) => c.length > 50); // skip near-empty tail chunks
}

// ─── DB setup ─────────────────────────────────────────────────────────────────

function createDb() {
  const connection = postgres(process.env.DATABASE_URL!, { prepare: false });
  return drizzle(connection);
}

// ─── Main seed logic ──────────────────────────────────────────────────────────

async function seedDocument(
  db: ReturnType<typeof createDb>,
  docPath: string,
  source: string,
  state: string | null,
) {
  if (!fs.existsSync(docPath)) {
    console.warn(`[seed] Skipping ${source} — file not found: ${docPath}`);
    return 0;
  }

  // Check if chunks already exist for this source (skip if already seeded)
  const existing = await db
    .select({ id: knowledgeChunks.id })
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.source, source))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[seed] Skipping ${source} — already seeded (${existing.length}+ chunks exist)`);
    return 0;
  }

  const content = fs.readFileSync(docPath, "utf-8");
  const chunks = chunkText(content);

  console.log(`[seed] ${source}: ${chunks.length} chunks to embed and insert`);

  let inserted = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkId = `${source}-chunk-${i}`;

    // Embed
    let embedding: number[];
    try {
      const result = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: chunk,
      });
      embedding = result.embedding;
    } catch (err) {
      console.error(`[seed] Failed to embed chunk ${i} of ${source}:`, err);
      continue;
    }

    // Insert with embedding via raw SQL (Drizzle doesn't support vector type natively)
    const embeddingLiteral = `[${embedding.join(",")}]`;
    await db.execute(sql`
      INSERT INTO knowledge_chunks (id, content, source, state, embedding, created_at)
      VALUES (
        ${chunkId},
        ${chunk},
        ${source},
        ${state},
        ${embeddingLiteral}::vector(1536),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `);

    inserted++;
    if (i % 10 === 0) {
      process.stdout.write(`  [${i + 1}/${chunks.length}]\r`);
    }
  }

  console.log(`[seed] ${source}: inserted ${inserted} chunks`);
  return inserted;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[seed] DATABASE_URL environment variable is required");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("[seed] OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  const db = createDb();
  let totalInserted = 0;

  for (const doc of DOCS_TO_SEED) {
    const inserted = await seedDocument(db, doc.path, doc.source, doc.state);
    totalInserted += inserted;
  }

  console.log(`\n[seed] Done. Total chunks inserted: ${totalInserted}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
