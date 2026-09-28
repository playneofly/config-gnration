import { NextResponse } from "next/server";
import { MAX_BULK_COUNT, syncFromSources, testConfigs } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * ساخت دسته‌ای از منابع واقعی — جایگزین تولید تصادفی که کانفیگ الکی می‌ساخت.
 * بدنه: { count: number, test?: boolean }
 *  ابتدا تا count کانفیگ واقعی از منابع عمومی وارد مخزن می‌شود، سپس یک
 *  دسته‌ی محدود به‌صورت واقعی تست اتصال می‌شود (بقیه در پس‌زمینه از طریق
 *  اندپوینت test-batch قابل تست‌اند).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { count?: number; test?: boolean };
    const count = Math.min(MAX_BULK_COUNT, Math.max(10, Math.floor(body.count ?? 500)));
    const wantTest = body.test !== false;

    const report = await syncFromSources({ maxInsert: count });

    let testResult: { tested: number; alive: number; dead: number } | null = null;
    if (wantTest) {
      testResult = await testConfigs({ limit: Math.min(count, 40) });
      report.tested = testResult.tested;
      report.aliveCount = testResult.alive;
    }

    return NextResponse.json({ ok: true, report, test: testResult });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "خطا در ساخت دسته‌ای", detail: String(e) },
      { status: 500 }
    );
  }
}
