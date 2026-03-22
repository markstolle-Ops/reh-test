-- Migration: Add PostGIS location column to listings table
-- Same raw SQL migration pattern used for pgvector in Phase 2.
-- Drizzle ignores SRID in DDL generation — must be done via raw SQL.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS location geometry(point, 4326);
CREATE INDEX IF NOT EXISTS listings_location_gist ON listings USING GIST(location);
