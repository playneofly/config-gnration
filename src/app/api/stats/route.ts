import { NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { configs, subscriptions } from "@/db/schema";
import { PROTOCOL_LIST } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [total] = await db.select({ value: count() }).from(configs);
    const [active] = await db
      .select({ value: count() })
      .from(configs)
      .where(eq(configs.enabled, true));
    const [subs] = await db.select({ value: count() }).from(subscriptions);
    const perProtocol = await db
      .select({
        protocol: configs.protocol,
        value: count(),
      })
      .from(configs)
      .groupBy(configs.protocol);
    const recent = await db
      .select()
      .from(configs)
      .orderBy(desc(configs.id))
      .limit(6);

    const byProtocol = Object.fromEntries(
      PROTOCOL_LIST.map((p) => [
        p,
        perProtocol.find((r) => r.protocol === p)?.value ?? 0,
      ])
    );

    const [appearance] = await db
      .select({
        hosts: sql<number>`count(distinct ${configs.host})`,
        ports: sql<number>`count(distinct ${configs.port})`,
      })
      .from(configs);

    return NextResponse.json({
      total: total.value,
      active: active.value,
      subs: subs.value,
      byProtocol,
      distinctHosts: Number(appearance?.hosts ?? 0),
      recent: recent.map((r) => ({
        id: r.id,
        name: r.name,
        protocol: r.protocol,
        host: r.host,
        port: r.port,
        enabled: r.enabled,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در دریافت آمار", detail: String(e) },
      { status: 500 }
    );
  }
}
