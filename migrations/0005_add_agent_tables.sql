-- Migration: Add agent-for-hire marketplace tables
-- Phase 5: Agent profiles, license checks, agent requests, buyer events

-- Enums
DO $$ BEGIN
  CREATE TYPE agent_license_check_method AS ENUM ('arello', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agent_request_status AS ENUM ('pending', 'accepted', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Agent Profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  license_states TEXT[] NOT NULL DEFAULT '{}',
  license_number TEXT NOT NULL,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  available_for_dispatch BOOLEAN NOT NULL DEFAULT FALSE,
  flat_fee_cents INTEGER NOT NULL DEFAULT 50000,
  bio TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

-- Agent License Checks
CREATE TABLE IF NOT EXISTS agent_license_checks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  method agent_license_check_method NOT NULL,
  arello_result TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_license_checks_agent_id ON agent_license_checks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_license_checks_agent_state ON agent_license_checks(agent_id, state);

-- Agent Requests
CREATE TABLE IF NOT EXISTS agent_requests (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agent_profiles(id),
  state TEXT NOT NULL,
  status agent_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_requests_transaction_id ON agent_requests(transaction_id);
CREATE INDEX IF NOT EXISTS idx_agent_requests_state_status ON agent_requests(state, status);

-- Buyer Events
CREATE TABLE IF NOT EXISTS buyer_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  listing_id TEXT,
  metadata TEXT NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_events_user_occurred ON buyer_events(user_id, occurred_at DESC);
