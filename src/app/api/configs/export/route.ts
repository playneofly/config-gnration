import { and, asc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { rowToConfigInput } from "@/lib/rowmap";
import { buildShareLink } from "@/lib/share";
import type { Protocol } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_EXPORT = 500_000;

/** خروجی فایل متنی از لینک‌های اشتراک (با فیلتر جستجو و پروتکل) */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    const proto = url.searchParams.get("protocol");
    const limit = Math.min(
      MAX_EXPORT,
      Math.max(1, Number(url.searchParams.get("limit")) || 100_000)
    );

    const conds: SQL[] = [];
    if (proto && proto !== "all")
      conds.push(eq(configs.protocol, proto as Protocol));
    if (q) {
      const like = or(
        ilike(configs.name, `%${q}%`),
        ilike(configs.host, `%${q}%`)
      );
      if (like) conds.push(like);
    }

    const rows = await db
      .select()
      .from(configs)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(asc(configs.id))
      .limit(limit);

    const text = rows.map((r) => buildShareLink(rowToConfigInput(r))).join("\n");

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="configs-${rows.length}.txt"`,
        "X-Export-Count": String(rows.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "خطا در خروجی گرفتن", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
