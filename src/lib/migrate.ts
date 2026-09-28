import type { Pool } from "pg";

/**
 * مهاجرت خودکار و خودترمیم — idempotent و افزایشی.
 *
 * باگ قبلی: فقط «CREATE TABLE IF NOT EXISTS» اجرا می‌شد. اگر کاربر قبلاً
 * database.sql نسخه‌ی قدیمی را اجرا کرده بود، جدول configs شکل قدیمی داشت
 * (بدون fingerprint و alive و …) و بعد CREATE INDEX روی ستون ناموجود
 * کل مهاجرت را منفجر می‌کرد؛ نتیجه: همه‌ی اندپوینت‌ها خطا می‌دادند.
 *
 * راه‌حل: هر ستون جداگانه با «ADD COLUMN IF NOT EXISTS» اضافه می‌شود،
 * ردیف‌های قدیمی backfill می‌شوند و ایندکس‌ها فقط بعد از تضمین وجود
 * ستون‌ها ساخته می‌شوند. این اسکریپت روی دیتابیس خالی، دیتابیس قدیمی
 * و دیتابیس به‌روز، هر سه، بدون خطا کار می‌کند.
 */
const DDL = `
-- ========== configs ==========
CREATE TABLE IF NOT EXISTS configs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  protocol TEXT NOT NULL DEFAULT 'vless',
  host TEXT NOT NULL DEFAULT '',
  port INTEGER NOT NULL DEFAULT 443
);
ALTER TABLE configs ADD COLUMN IF NOT EXISTS fingerprint TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS uuid TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS flow TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS security TEXT NOT NULL DEFAULT 'tls';
ALTER TABLE configs ADD COLUMN IF NOT EXISTS transport TEXT NOT NULL DEFAULT 'ws';
ALTER TABLE configs ADD COLUMN IF NOT EXISTS sni TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS host_header TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS path TEXT DEFAULT '/';
ALTER TABLE configs ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS private_key TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS local_address TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS reserved TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS mtu INTEGER;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS alive BOOLEAN;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS latency INTEGER;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS last_tested_at TIMESTAMPTZ;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE configs ADD COLUMN IF NOT EXISTS raw_link TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ردیف‌های قدیمی بدون fingerprint یک مقدار قطعی می‌گیرند تا NOT NULL بشوند
UPDATE configs
SET fingerprint = md5(protocol || '|' || host || '|' || port || '|' || coalesce(uuid, password, private_key, ''))
WHERE fingerprint IS NULL;
ALTER TABLE configs ALTER COLUMN fingerprint SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS configs_fingerprint_idx ON configs (fingerprint);
CREATE INDEX IF NOT EXISTS configs_protocol_idx ON configs (protocol);
CREATE INDEX IF NOT EXISTS configs_enabled_idx ON configs (enabled);
CREATE INDEX IF NOT EXISTS configs_alive_idx ON configs (alive);

-- ========== subscriptions ==========
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  token TEXT NOT NULL DEFAULT ''
);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS only_alive BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS max_configs INTEGER NOT NULL DEFAULT 200;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_token_idx ON subscriptions (token);

-- ========== sync_runs ==========
CREATE TABLE IF NOT EXISTS sync_runs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS fetched_lines INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS parsed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS inserted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS duplicates INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS failed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS tested INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS alive_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS sources_ok INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS sources_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sync_runs ADD COLUMN IF NOT EXISTS detail JSONB NOT NULL DEFAULT '[]'::jsonb;
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
