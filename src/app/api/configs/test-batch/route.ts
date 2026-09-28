import { NextResponse } from "next/server";
import { testConfigs } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** تست گروهی واقعی: تست‌نشده‌ها (و بعد قدیمی‌ترین تست‌ها) را پروب می‌کند */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(60, Math.max(1, body.limit ?? 30));
    const result = await testConfigs({ limit });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "خطا در تست گروهی", detail: String(e) }, { status: 500 });
  }
}
