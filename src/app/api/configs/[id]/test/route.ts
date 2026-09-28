import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { probeConfig } from "@/lib/tester";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const [row] = await db.select().from(configs).where(eq(configs.id, Number(id)));
    if (!row) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });

    // UDP-based protocols are not TCP-testable
    if (row.transport === "udp" || row.protocol === "hysteria2" || row.protocol === "tuic") {
      await db
        .update(configs)
        .set({ alive: null, latency: null, lastTestedAt: new Date() })
        .where(eq(configs.id, row.id));
      return NextResponse.json({ alive: null, latency: null, note: "udp-untestable" });
    }

    const result = await probeConfig(row);
    await db
      .update(configs)
      .set({ alive: result.alive, latency: result.latency, lastTestedAt: new Date() })
      .where(eq(configs.id, row.id));

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "خطا در تست", detail: String(e) }, { status: 500 });
  }
}
