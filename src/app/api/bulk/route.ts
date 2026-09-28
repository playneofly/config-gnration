import { NextResponse } from "next/server";
import { MAX_BULK_COUNT, syncFromSources } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * ساخت دسته‌ای از منابع واقعی — جایگزین تولید تصادفی که کانفیگ الکی می‌ساخت.
 * بدنه: { count: number } → حداکثر MAX_BULK_COUNT
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { count?: number; test?: boolean };
    const count = Math.min(MAX_BULK_COUNT, Math.max(10, Math.floor(body.count ?? 500)));
    const wantTest = body.test !== false;

    const report = await syncFromSources({
      maxInsert: count,
      maxTest: wantTest ? Math.min(count, 150) : 0,
    });

    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "خطا در ساخت دسته‌ای", detail: String(e) },
      { status: 500 }
    );
  }
}
