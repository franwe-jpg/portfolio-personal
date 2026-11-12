-- 2026-11-12: one chat table per site and raw IPs.
-- For databases created before this change (db/schema.sql already includes it).
-- Run once: npx wrangler d1 execute portfolio --remote --file db/migrations/0001_chat_log_v2_and_raw_ips.sql

CREATE TABLE IF NOT EXISTS chat_log_v2 (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  ip         TEXT,
  ip_hash    TEXT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  model      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_log_v2_created_at ON chat_log_v2 (created_at DESC);
CREATE INDEX IF NOT EXISTS chat_log_v2_ip ON chat_log_v2 (ip);

ALTER TABLE contact_message ADD COLUMN ip TEXT;
