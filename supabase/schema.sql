-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)
-- Creates the app_keys table for Badsha AutoBet

CREATE TABLE IF NOT EXISTS app_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  key TEXT NOT NULL,
  expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by uid + key (used in validate)
CREATE INDEX IF NOT EXISTS idx_app_keys_uid_key ON app_keys (uid, key);

-- Enable Row Level Security (service role bypasses RLS)
ALTER TABLE app_keys ENABLE ROW LEVEL SECURITY;

-- Block direct anon/authenticated access (API uses service role)
DROP POLICY IF EXISTS "Service role only" ON app_keys;
CREATE POLICY "Service role only" ON app_keys
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- App settings (Telegram, etc.) - editable via Admin
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON app_settings;
CREATE POLICY "Service role only" ON app_settings
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Seed default keys (run once)
INSERT INTO app_settings (key, value) VALUES
  ('telegram_bot_token', ''),
  ('telegram_channel_id', '')
ON CONFLICT (key) DO NOTHING;
