import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { testMany } from "@/lib/tester";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** تست گروهی: قدیمی‌ترین تست‌نشده‌ها را تست می‌کند */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(60, Math.max(1, body.limit ?? 30));

    const targets = await db
      .select({
        id: configs.id,
        host: configs.host,
        port: configs.port,
        security: configs.security,
        sni: configs.sni,
      })
      .from(configs)
      .where(sql`${configs.transport} <> 'udp' AND ${configs.protocol} NOT IN ('hysteria2','tuic')`)
      .orderBy(sql`${configs.lastTestedAt} ASC NULLS FIRST`, asc(configs.id))
      .limit(limit);

    let alive = 0;
    await testMany(targets, 40, 1800, async (t, r) => {
      if (r.alive) alive++;
      await db
        .update(configs)
        .set({ alive: r.alive, latency: r.latency, lastTestedAt: new Date() })
        .where(eq(configs.id, t.id));
    });

    return NextResponse.json({ tested: targets.length, alive, dead: targets.length - alive });
  } catch (e) {
    return NextResponse.json({ error: "خطا در تست گروهی", detail: String(e) }, { status: 500 });
  }
}
