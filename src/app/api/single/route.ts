import { NextResponse } from "next/server";
import { pickRandomAlive, syncFromSources } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ساخت تکی: یک کانفیگ واقعیِ تست‌شده از دیتابیس برمی‌گرداند.
 * اگر دیتابیس خالی/بدون کانفیگ سالم باشد، اول همگام‌سازی می‌کند.
 */
export async function POST() {
  try {
    let item = await pickRandomAlive();

    if (!item) {
      await syncFromSources({ maxInsert: 300, maxTest: 120 });
      item = await pickRandomAlive();
    }

    if (!item) {
      return NextResponse.json(
        {
          error:
            "در حال حاضر کانفیگ سالمی پیدا نشد. چند لحظه دیگر دوباره امتحان کنید یا از بخش ساخت دسته‌ای استفاده کنید.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: "خطا در ساخت کانفیگ", detail: String(e) }, { status: 500 });
  }
}
