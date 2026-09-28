import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { onlyAlive?: boolean; maxConfigs?: number; name?: string };
    const [row] = await db
      .update(subscriptions)
      .set({
        ...(body.onlyAlive !== undefined ? { onlyAlive: body.onlyAlive } : {}),
        ...(body.maxConfigs !== undefined
          ? { maxConfigs: Math.min(2000, Math.max(10, body.maxConfigs)) }
          : {}),
        ...(body.name ? { name: body.name } : {}),
      })
      .where(eq(subscriptions.id, Number(id)))
      .returning();
    if (!row) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ item: row });
  } catch (e) {
    return NextResponse.json({ error: "خطا در به‌روزرسانی", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const deleted = await db
      .delete(subscriptions)
      .where(eq(subscriptions.id, Number(id)))
      .returning({ id: subscriptions.id });
    if (!deleted.length) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "خطا در حذف", detail: String(e) }, { status: 500 });
  }
}
