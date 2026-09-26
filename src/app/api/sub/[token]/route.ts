import { eq } from "drizzle-orm";
import { db } from "@/db";
import { configs, subscriptions } from "@/db/schema";
import { rowToConfigInput } from "@/lib/rowmap";
import { buildRawSub, buildV2raySub, b64encode } from "@/lib/share";
import { buildClashConfig, buildSingBoxConfig } from "@/lib/subgen";
import type { ConfigInput, SubFormat } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

function detectFormat(req: Request): SubFormat {
  const url = new URL(req.url);
  const q = (url.searchParams.get("format") || "").toLowerCase();
  if (q === "singbox" || q === "sing-box" || q === "json") return "singbox";
  if (q === "clash" || q === "yaml" || q === "yml") return "clash";
  if (q === "raw" || q === "txt" || q === "plain") return "raw";
  if (q === "v2ray" || q === "base64") return "v2ray";
  const ua = (req.headers.get("user-agent") || "").toLowerCase();
  if (ua.includes("clash") || ua.includes("mihomo") || ua.includes("stash"))
    return "clash";
  if (ua.includes("sing-box") || ua.includes("singbox") || ua.includes("sfa") || ua.includes("sfm") || ua.includes("sfi"))
    return "singbox";
  return "v2ray";
}

export async function GET(req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.token, token))
    .limit(1);

  if (!sub) {
    return new Response("اشتراک پیدا نشد یا منقضی شده است", { status: 404 });
  }

  let rows = await db.select().from(configs).where(eq(configs.enabled, true));
  if (sub.mode === "selected" && (sub.configIds ?? []).length) {
    const ids = (sub.configIds ?? []).filter((n) => Number.isInteger(n));
    rows = rows.filter((r) => ids.includes(r.id));
  }
  rows = rows.sort((a, b) => a.id - b.id);

  const items: ConfigInput[] = rows.map(rowToConfigInput);

  const format = detectFormat(req);
  let body: string;
  let contentType = "text/plain; charset=utf-8";

  switch (format) {
    case "singbox":
      body = buildSingBoxConfig(items);
      contentType = "application/json; charset=utf-8";
      break;
    case "clash":
      body = buildClashConfig(items);
      contentType = "text/yaml; charset=utf-8";
      break;
    case "raw":
      body = buildRawSub(items);
      break;
    default:
      body = buildV2raySub(items);
  }

  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Profile-Title": `base64:${b64encode(sub.name)}`,
    "Profile-Update-Interval": "24",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(
      sub.name
    )}`,
  });

  return new Response(body, { status: 200, headers });
}
