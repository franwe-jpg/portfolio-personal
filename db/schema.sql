-- Per-IP daily question quota for the portfolio chat endpoint.
-- `ip_hash` is a salted SHA-256 hex digest; raw IPs are never stored.
CREATE TABLE IF NOT EXISTS question_quota (
  ip_hash TEXT NOT NULL,
  day     TEXT NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);
