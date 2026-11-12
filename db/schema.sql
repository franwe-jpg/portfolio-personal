-- Per-IP daily question quota for the portfolio chat endpoint.
-- `ip_hash` is a salted SHA-256 hex digest; raw IPs are never stored.
CREATE TABLE IF NOT EXISTS question_quota (
  ip_hash TEXT NOT NULL,
  day     TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

-- Transcript of every answered chat exchange of the v1 site (portfolio-v1),
-- which shares this database. The current site writes to chat_log_v2.
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

-- Transcript of every answered chat exchange of the current site.
--
-- `ip` is the visitor's raw address (CF-Connecting-IP; NULL when absent, as in
-- local dev); `ip_hash` is the salted digest used by question_quota.
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

-- Messages sent from the contact form (home scene, "Mail" option).
--
-- Every accepted message is stored here first, so it is never lost even if the
-- notification email fails; `emailed` records whether that email went out.
-- `ip` is the raw address; `ip_hash` is the salted digest behind the per-IP daily limit.
CREATE TABLE IF NOT EXISTS contact_message (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  ip         TEXT,
  ip_hash    TEXT NOT NULL,
  lang       TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  emailed    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS contact_message_ip_day ON contact_message (ip_hash, created_at);
