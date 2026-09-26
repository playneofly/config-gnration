import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { newToken } from "@/lib/utils";
import type { SubscriptionDto } from "@/lib/types";

export const dynamic = "force-dynamic";

function toDto(row: typeof subscriptions.$inferSelect): SubscriptionDto {
  return {
    id: row.id,
    name: row.name,
    token: row.token,
    mode: (row.mode as "all" | "selected") ?? "all",
    configIds: row.configIds ?? [],
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.id));
    return NextResponse.json({ items: rows.map(toDto) });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در خواندن اشتراک‌ها", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      mode?: "all" | "selected";
      configIds?: number[];
    };
    const name = (body.name ?? "").trim() || "اشتراک اصلی";
    const mode = body.mode === "selected" ? "selected" : "all";
    const configIds = Array.isArray(body.configIds)
      ? body.configIds.filter((n) => Number.isInteger(n))
      : [];
    if (mode === "selected" && !configIds.length) {
      return NextResponse.json(
        { error: "حداقل یک کانفیگ انتخاب کنید یا حالت «همه» را بزنید" },
        { status: 400 }
      );
    }
    const [row] = await db
      .insert(subscriptions)
      .values({ name, mode, configIds, token: newToken(16) })
      .returning();
    return NextResponse.json({ item: toDto(row) }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در ساخت اشتراک", detail: String(e) },
      { status: 500 }
    );
  }
}
