import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { rowToConfigWithShare } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(configs).where(eq(configs.id, Number(id)));
  if (!row) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
  return NextResponse.json({ item: rowToConfigWithShare(row) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { enabled?: boolean };
    const [row] = await db
      .update(configs)
      .set({ enabled: body.enabled ?? true })
      .where(eq(configs.id, Number(id)))
      .returning();
    if (!row) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ item: rowToConfigWithShare(row) });
  } catch (e) {
    return NextResponse.json({ error: "خطا در به‌روزرسانی", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const deleted = await db.delete(configs).where(eq(configs.id, Number(id))).returning({ id: configs.id });
    if (!deleted.length) return NextResponse.json({ error: "یافت نشد" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "خطا در حذف", detail: String(e) }, { status: 500 });
  }
}
