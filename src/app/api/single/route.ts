import { NextResponse } from "next/server";
import { pickRandomAlive, syncFromSources, testConfigs } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * ساخت تکی: یک کانفیگ واقعیِ تست‌شده از دیتابیس برمی‌گرداند.
 * بدنه‌ی اختیاری: { protocol?: "vless" | "vmess" | ... } → فیلتر پروتکل
 * اگر کانفیگ سالم نبود، منابع زنده همگام و یک دسته‌ی کوچک تست می‌شود و
 * دوباره تلاش می‌کنیم.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { protocol?: string };
    const protocol =
      typeof body.protocol === "string" && body.protocol !== "random"
        ? body.protocol
        : null;

    let item = await pickRandomAlive(protocol);

    if (!item) {
      // مخزن خالی است یا کانفیگ سالمی ندارد → جمع‌آوری واقعی از منابع
      await syncFromSources({ maxInsert: 400 });
      // تست واقعیِ دسته‌ی کوچک تا درخواست به‌موقع برگردد
      await testConfigs({ limit: 24 });
      item = await pickRandomAlive(protocol);
    }

    if (!item && protocol) {
      // شاید سالمِ همین پروتکل نمانده؛ یک کانفیگ سالمِ هر پروتکلی پیشنهاد بده
      item = await pickRandomAlive();
    }

    if (!item) {
      // یک دور دوم روی کانفیگ‌های تست‌نشده‌ی قدیمی‌تر
      await testConfigs({ limit: 24 });
      item = await pickRandomAlive(protocol) ?? (protocol ? await pickRandomAlive() : null);
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
