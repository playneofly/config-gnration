import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";

export const dynamic = "force-dynamic";

const EDITABLE = [
  "name",
  "host",
  "port",
  "uuid",
  "password",
  "flow",
  "security",
  "transport",
  "sni",
  "hostHeader",
  "path",
  "serviceName",
  "method",
  "publicKey",
  "privateKey",
  "localAddress",
  "reserved",
  "mtu",
  "enabled",
  "extras",
  "protocol",
] as const;

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
    for (const key of EDITABLE) {
      if (key in body) patch[key] = body[key];
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json(
        { error: "فیلدی برای به‌روزرسانی ارسال نشده است" },
        { status: 400 }
      );
    }
    const [row] = await db
      .update(configs)
      .set(patch)
      .where(eq(configs.id, numId))
      .returning({ id: configs.id });
    if (!row) {
      return NextResponse.json({ error: "کانفیگ پیدا نشد" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در ویرایش کانفیگ", detail: String(e) },
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
    await db
      .delete(configs)
      .where(
        id === "all"
          ? sql`true`
          : eq(configs.id, numId)
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در حذف کانفیگ", detail: String(e) },
      { status: 500 }
    );
  }
}
