-- ─── pgvector Extension ────────────────────────────────────────────────────────
-- NOTE: Run this migration in the Supabase SQL editor or via migration tool.
-- Drizzle does not natively support vector types; this is a raw SQL migration.

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Embedding Column ─────────────────────────────────────────────────────────
-- Add a 1536-dimension embedding column (text-embedding-3-small output size)

ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- ─── HNSW Index ───────────────────────────────────────────────────────────────
-- HNSW (Hierarchical Navigable Small World) index for approximate nearest neighbor
-- search using cosine distance. Faster than IVFFlat for < 1M rows.

CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

-- ─── match_documents Function ─────────────────────────────────────────────────
-- Cosine similarity search over knowledge_chunks.
-- Parameters:
--   query_embedding  : vector(1536) — the embedded query
--   match_threshold  : float (default 0.7) — minimum cosine similarity score
--   match_count      : int (default 5) — max results to return
--   filter_state     : text (optional) — filter by state column (NULL = no filter)

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_state text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  content text,
  source text,
  state text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.source,
    kc.state,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
    AND (filter_state IS NULL OR kc.state = filter_state OR kc.state IS NULL)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
