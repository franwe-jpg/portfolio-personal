-- Per-IP daily question quota for the portfolio chat endpoint.
-- `ip_hash` is a salted SHA-256 hex digest; raw IPs are never stored.
CREATE TABLE IF NOT EXISTS question_quota (
  ip_hash TEXT NOT NULL,
  day     TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

-- Transcript of every answered chat exchange.
--
-- `ip_hash` reuses the same salted digest as question_quota so a conversation
-- can be grouped by visitor without ever storing a raw IP. Rows are written
-- only after the model answers successfully; failed or quota-blocked requests
-- leave no transcript.
CREATE TABLE IF NOT EXISTS chat_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  model      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_log_created_at ON chat_log (created_at DESC);
