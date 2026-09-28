import type { Pool } from "pg";

/**
 * ساخت خودکار جدول‌ها در اولین اتصال — idempotent.
 * باعث می‌شود روی هر PostgreSQL تازه (Neon، Supabase، لوکال…) بدون
 * اجرای دستی migration همه‌چیز کار کند.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS configs (
  id SERIAL PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  uuid TEXT,
  password TEXT,
  flow TEXT,
  security TEXT NOT NULL DEFAULT 'tls',
  transport TEXT NOT NULL DEFAULT 'ws',
  sni TEXT,
  host_header TEXT,
  path TEXT DEFAULT '/',
  service_name TEXT,
  method TEXT,
  public_key TEXT,
  private_key TEXT,
  local_address TEXT,
  reserved TEXT,
  mtu INTEGER,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  alive BOOLEAN,
  latency INTEGER,
  last_tested_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  raw_link TEXT,
  extras JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS configs_fingerprint_idx ON configs (fingerprint);
CREATE INDEX IF NOT EXISTS configs_protocol_idx ON configs (protocol);
CREATE INDEX IF NOT EXISTS configs_enabled_idx ON configs (enabled);
CREATE INDEX IF NOT EXISTS configs_alive_idx ON configs (alive);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token TEXT NOT NULL,
  only_alive BOOLEAN NOT NULL DEFAULT TRUE,
  max_configs INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_token_idx ON subscriptions (token);

CREATE TABLE IF NOT EXISTS sync_runs (
  id SERIAL PRIMARY KEY,
  fetched_lines INTEGER NOT NULL DEFAULT 0,
  parsed INTEGER NOT NULL DEFAULT 0,
  inserted INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  tested INTEGER NOT NULL DEFAULT 0,
  alive_count INTEGER NOT NULL DEFAULT 0,
  sources_ok INTEGER NOT NULL DEFAULT 0,
  sources_total INTEGER NOT NULL DEFAULT 0,
  detail JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let schemaPromise: Promise<void> | null = null;

export function ensureSchema(pool: Pool): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = pool
      .query(DDL)
      .then(() => undefined)
      .catch((err) => {
        // اگر خطا خورد، دفعه بعد دوباره تلاش کند
        schemaPromise = null;
        throw err;
      });
  }
  return schemaPromise;
}
