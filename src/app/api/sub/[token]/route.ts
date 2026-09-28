import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configs, subscriptions } from "@/db/schema";
import { buildRawSub, buildV2raySub } from "@/lib/share";
import { rowToConfigWithShare } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

/**
 * خروجی سابسکریپشن استاندارد (base64) برای v2rayNG / Streisand / V2Box و...
 * ?format=raw → لینک‌های خام
 * ?alive=0 → شامل کانفیگ‌های تست‌نشده هم بشود
 */
export async function GET(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.token, token));
  if (!sub) {
    return new Response("subscription not found", { status: 404 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "base64";
  const includeUntested = url.searchParams.get("alive") === "0";

  let rows = await db.select().from(configs).where(eq(configs.enabled, true));
  if (sub.onlyAlive && !includeUntested) {
    rows = rows.filter((r) => r.alive === true);
  }
  // سالم‌ها اول، بعد تازه‌ها
  rows.sort((a, b) => {
    const al = (b.alive === true ? 1 : 0) - (a.alive === true ? 1 : 0);
    if (al !== 0) return al;
    return b.id - a.id;
  });
  rows = rows.slice(0, sub.maxConfigs);

  const list = rows.map(rowToConfigWithShare);
  const body = format === "raw" ? buildRawSub(list) : buildV2raySub(list);

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Profile-Title": Buffer.from(sub.name, "utf8").toString("base64"),
      "Profile-Update-Interval": "6",
      "Subscription-Userinfo": "upload=0; download=0; total=0; expire=0",
    },
  });
}
