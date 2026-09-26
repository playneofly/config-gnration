import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { newToken } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }
    const body = (await req.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim())
      patch.name = body.name.trim();
    if (body.mode === "all" || body.mode === "selected") patch.mode = body.mode;
    if (Array.isArray(body.configIds))
      patch.configIds = body.configIds.filter((n) => Number.isInteger(n));
    if (body.regenerate === true) patch.token = newToken(16);
    if (!Object.keys(patch).length) {
      return NextResponse.json(
        { error: "فیلدی برای به‌روزرسانی ارسال نشده است" },
        { status: 400 }
      );
    }
    const [row] = await db
      .update(subscriptions)
      .set(patch)
      .where(eq(subscriptions.id, numId))
      .returning({ id: subscriptions.id });
    if (!row) {
      return NextResponse.json({ error: "اشتراک پیدا نشد" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در ویرایش اشتراک", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });
    }
    await db.delete(subscriptions).where(eq(subscriptions.id, numId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در حذف اشتراک", detail: String(e) },
      { status: 500 }
    );
  }
}
