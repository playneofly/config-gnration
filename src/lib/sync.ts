import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { configs, syncRuns } from "@/db/schema";
import type { ConfigInput, ConfigWithShare, SyncReport, SyncSourceResult } from "./types";
import { buildShareLink, parseShareLink } from "./share";
import { extractLinks, fetchSourceText, PUBLIC_SOURCES } from "./sources";
import { testMany } from "./tester";

export const MAX_BULK_COUNT = 5000;

/** اثرانگشت یکتا برای جلوگیری از تکراری‌ها */
export function fingerprint(c: ConfigInput): string {
  const identity = c.rawLink
    ? c.rawLink.split("#")[0]
    : `${c.protocol}|${c.host}|${c.port}|${c.uuid ?? c.password ?? c.privateKey ?? ""}`;
  return createHash("sha256").update(identity).digest("hex").slice(0, 40);
}

function toRow(c: ConfigInput, source: string) {
  return {
    fingerprint: fingerprint(c),
    name: (c.name || `${c.host}:${c.port}`).slice(0, 180),
    protocol: c.protocol,
    host: c.host,
    port: c.port,
    uuid: c.uuid || null,
    password: c.password || null,
    flow: c.flow || null,
    security: c.security ?? "tls",
    transport: c.transport ?? "ws",
    sni: c.sni || null,
    hostHeader: c.hostHeader || null,
    path: c.path || "/",
    serviceName: c.serviceName || null,
    method: c.method || null,
    publicKey: c.publicKey || null,
    privateKey: c.privateKey || null,
    localAddress: c.localAddress || null,
    reserved: c.reserved || null,
    mtu: c.mtu ?? null,
    enabled: true,
    source,
    rawLink: c.rawLink || null,
    extras: c.extras ?? {},
  };
}

export function rowToConfigWithShare(row: typeof configs.$inferSelect): ConfigWithShare {
  const input: ConfigInput = {
    name: row.name,
    protocol: row.protocol as ConfigInput["protocol"],
    host: row.host,
    port: row.port,
    uuid: row.uuid,
    password: row.password,
    flow: row.flow,
    security: row.security as ConfigInput["security"],
    transport: row.transport as ConfigInput["transport"],
    sni: row.sni,
    hostHeader: row.hostHeader,
    path: row.path,
    serviceName: row.serviceName,
    method: row.method,
    publicKey: row.publicKey,
    privateKey: row.privateKey,
    localAddress: row.localAddress,
    reserved: row.reserved,
    mtu: row.mtu,
    enabled: row.enabled,
    rawLink: row.rawLink,
    extras: (row.extras as Record<string, string>) ?? {},
  };
  return {
    ...input,
    id: row.id,
    share: buildShareLink(input),
    alive: row.alive,
    latency: row.latency,
    source: row.source,
    lastTestedAt: row.lastTestedAt ? row.lastTestedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

interface SyncOptions {
  /** تا چند کانفیگ جدید وارد دیتابیس شود */
  maxInsert: number;
  /** تا چند کانفیگ جدید تست اتصال شوند */
  maxTest: number;
}

export async function syncFromSources(opts: SyncOptions): Promise<SyncReport> {
  const started = Date.now();
  const sourceResults: SyncSourceResult[] = [];
  const allLinks: { link: string; source: string }[] = [];

  // دریافت همه منابع با همزمانی محدود
  const queue = [...PUBLIC_SOURCES];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const src = queue.shift()!;
      const res = await fetchSourceText(src.url);
      if (!res.ok) {
        sourceResults.push({ name: src.name, url: src.url, ok: false, lines: 0, error: res.error });
        continue;
      }
      const links = extractLinks(res.text);
      sourceResults.push({ name: src.name, url: src.url, ok: true, lines: links.length });
      for (const link of links) allLinks.push({ link, source: src.name });
    }
  });
  await Promise.all(workers);

  // پارس + حذف تکراری درون حافظه
  const seen = new Set<string>();
  const parsed: { cfg: ConfigInput; source: string; fp: string }[] = [];
  let failed = 0;
  let duplicates = 0;

  for (const { link, source } of allLinks) {
    let cfg: ConfigInput;
    try {
      cfg = parseShareLink(link);
      if (!cfg.host || !cfg.port) throw new Error("no host");
      // برای لینک‌های اصلی، لینک خام را نگه می‌داریم تا هیچ پارامتری گم نشود
      if (!cfg.rawLink && (link.startsWith("vless://") || link.startsWith("trojan://")))
        cfg.rawLink = link;
    } catch {
      failed++;
      continue;
    }
    const fp = fingerprint(cfg);
    if (seen.has(fp)) {
      duplicates++;
      continue;
    }
    seen.add(fp);
    parsed.push({ cfg, source, fp });
  }

  // درج دسته‌ای با onConflictDoNothing — بدون خطا حتی با هزاران رکورد
  // ابتدا مخلوط می‌کنیم تا هر اجرا نمونه‌ای متفاوت از استخر بگیرد
  for (let i = parsed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parsed[i], parsed[j]] = [parsed[j], parsed[i]];
  }
  const toInsert = parsed.slice(0, opts.maxInsert);
  let inserted = 0;
  const insertedRows: { id: number; host: string; port: number; security: string; sni: string | null }[] = [];
  const CHUNK = 150;

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const rows = chunk.map(({ cfg, source }) => toRow(cfg, source));
    const result = await db
      .insert(configs)
      .values(rows)
      .onConflictDoNothing({ target: configs.fingerprint })
      .returning({
        id: configs.id,
        host: configs.host,
        port: configs.port,
        security: configs.security,
        sni: configs.sni,
      });
    inserted += result.length;
    insertedRows.push(...result);
  }
  duplicates += toInsert.length - inserted + Math.max(0, parsed.length - toInsert.length);

  // تست اتصال واقعی روی کانفیگ‌های تازه
  const testTargets = insertedRows.slice(0, opts.maxTest);
  let aliveCount = 0;
  if (testTargets.length > 0) {
    await testMany(testTargets, 120, 1500, async (target, r) => {
      if (r.alive) aliveCount++;
      await db
        .update(configs)
        .set({ alive: r.alive, latency: r.latency, lastTestedAt: new Date() })
        .where(eq(configs.id, target.id));
    });
  }

  const report: SyncReport = {
    fetchedLines: allLinks.length,
    parsed: parsed.length,
    inserted,
    duplicates,
    failed,
    tested: testTargets.length,
    aliveCount,
    sources: sourceResults,
    durationMs: Date.now() - started,
  };

  await db.insert(syncRuns).values({
    fetchedLines: report.fetchedLines,
    parsed: report.parsed,
    inserted: report.inserted,
    duplicates: report.duplicates,
    failed: report.failed,
    tested: report.tested,
    aliveCount: report.aliveCount,
    sourcesOk: sourceResults.filter((s) => s.ok).length,
    sourcesTotal: sourceResults.length,
    detail: sourceResults.map((s) => ({ name: s.name, lines: s.lines, ok: s.ok })),
  });

  return report;
}

/** انتخاب تصادفی یک کانفیگ سالم از دیتابیس */
export async function pickRandomAlive(): Promise<ConfigWithShare | null> {
  const rows = await db
    .select()
    .from(configs)
    .where(sql`${configs.enabled} = true AND ${configs.alive} = true`)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  if (rows.length) return rowToConfigWithShare(rows[0]);
  return null;
}

export async function getLastSyncRun() {
  const rows = await db.select().from(syncRuns).orderBy(desc(syncRuns.id)).limit(1);
  return rows[0] ?? null;
}

export async function getRecentSyncRuns(limit = 5) {
  return db.select().from(syncRuns).orderBy(desc(syncRuns.id)).limit(limit);
}
