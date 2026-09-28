import { NextResponse } from "next/server";
import { count, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { getRecentSyncRuns } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [totals, byProtocol, recentRuns, lastTested] = await Promise.all([
      db
        .select({
          total: count(),
          alive: sql<number>`count(*) filter (where ${configs.alive} = true)`,
          dead: sql<number>`count(*) filter (where ${configs.alive} = false)`,
          unknown: sql<number>`count(*) filter (where ${configs.alive} is null)`,
          enabled: sql<number>`count(*) filter (where ${configs.enabled} = true)`,
          avgLatency: sql<number>`coalesce(round(avg(${configs.latency}) filter (where ${configs.alive} = true)), 0)`,
        })
        .from(configs),
      db
        .select({ protocol: configs.protocol, value: count() })
        .from(configs)
        .groupBy(configs.protocol),
      getRecentSyncRuns(5),
      db
        .select({ t: configs.lastTestedAt })
        .from(configs)
        .where(isNotNull(configs.lastTestedAt))
        .orderBy(sql`${configs.lastTestedAt} desc`)
        .limit(1),
    ]);

    return NextResponse.json({
      total: totals[0]?.total ?? 0,
      alive: Number(totals[0]?.alive ?? 0),
      dead: Number(totals[0]?.dead ?? 0),
      unknown: Number(totals[0]?.unknown ?? 0),
      enabled: Number(totals[0]?.enabled ?? 0),
      avgLatency: Number(totals[0]?.avgLatency ?? 0),
      byProtocol: byProtocol.map((r) => ({ protocol: r.protocol, value: r.value })),
      recentRuns: recentRuns.map((r) => ({
        id: r.id,
        inserted: r.inserted,
        duplicates: r.duplicates,
        tested: r.tested,
        aliveCount: r.aliveCount,
        sourcesOk: r.sourcesOk,
        sourcesTotal: r.sourcesTotal,
        createdAt: r.createdAt.toISOString(),
      })),
      lastTestedAt: lastTested[0]?.t?.toISOString() ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در آمار", detail: String(e) }, { status: 500 });
  }
}
