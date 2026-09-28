import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { randomToken } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await db.select().from(subscriptions).orderBy(desc(subscriptions.id));
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        name: r.name,
        token: r.token,
        onlyAlive: r.onlyAlive,
        maxConfigs: r.maxConfigs,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در دریافت اشتراک‌ها", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      onlyAlive?: boolean;
      maxConfigs?: number;
    };
    const name = (body.name ?? "").trim() || "اشتراک جدید";
    const [row] = await db
      .insert(subscriptions)
      .values({
        name,
        token: randomToken(18),
        onlyAlive: body.onlyAlive ?? true,
        maxConfigs: Math.min(2000, Math.max(10, body.maxConfigs ?? 300)),
      })
      .returning();
    return NextResponse.json(
      {
        item: {
          id: row.id,
          name: row.name,
          token: row.token,
          onlyAlive: row.onlyAlive,
          maxConfigs: row.maxConfigs,
          createdAt: row.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json({ error: "خطا در ساخت اشتراک", detail: String(e) }, { status: 500 });
  }
}
