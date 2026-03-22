-- Migration: Add vector embedding column to listings table
-- pgvector extension already enabled from Phase 2 (knowledge_chunks embedding)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Index for approximate nearest-neighbor search (IVFFlat)
-- NOTE: Populate with embeddings before creating this index for best performance.
-- CREATE INDEX IF NOT EXISTS idx_listings_embedding ON listings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
