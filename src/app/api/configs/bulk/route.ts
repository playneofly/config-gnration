import { NextResponse } from "next/server";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { MIXED_PROTOCOL_CYCLE, randomPath, randomSni } from "@/lib/auto";
import { buildShareLink } from "@/lib/share";
import { newUuid, randInt, randomPassword } from "@/lib/utils";
import type { ConfigInput } from "@/lib/types";

export const dynamic = "force-dynamic";

type MixedProtocol = ConfigInput["protocol"] | "mixed";

interface BulkBody {
  prefix: string;
  count: number;
  protocol: MixedProtocol;
  hostMode: "fixed" | "rotate";
  hosts: string[];
  portMode: "fixed" | "range" | "pool";
  port: number;
  portMin: number;
  portMax: number;
  portPool: number[];
  security: ConfigInput["security"];
  transport: ConfigInput["transport"];
  sni?: string;
  hostHeader?: string;
  path?: string;
  serviceName?: string;
  method?: string;
  /** ادامه نام‌گذاری از این آغازگر (برای چانک‌های پی‌درپی) */
  startIndex?: number;
  /** تعداد کل برنامه‌ریزی‌شده (برای عرض صفرگذاری نام) */
  totalPlanned?: number;
}

/** حداکثر در هر درخواست — کلاینت برای حجم‌های بیشتر چانک می‌فرستد (تا ۱٬۰۰۰٬۰۰۰) */
const MAX_BATCH = 25_000;
/** سقف پارامتر PostgreSQL برابر ۶۵۵۳۵ است؛ با ۲۱ ستون → چانک امن ۲٬۵۰۰ ردیف */
const INSERT_CHUNK = 2_500;
const SHARE_LIMIT = 5_000;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BulkBody>;
    const count = Math.floor(Number(body.count) || 0);
    const hosts = (body.hosts ?? []).map((h) => h.trim()).filter(Boolean);
    const prefix = (body.prefix ?? "").trim();

    if (!prefix) return NextResponse.json({ error: "پیشوند نام الزامی است" }, { status: 400 });
    if (count < 1 || count > MAX_BATCH)
      return NextResponse.json(
        { error: `تعداد هر درخواست باید بین ۱ تا ${MAX_BATCH.toLocaleString("en-US")} باشد` },
        { status: 400 }
      );
    if (body.hostMode === "rotate" && !hosts.length)
      return NextResponse.json({ error: "حداقل یک سرور برای چرخش وارد کنید" }, { status: 400 });
    if (body.protocol === "shadowsocks" && !body.method)
      return NextResponse.json({ error: "رمزنگاری Shadowsocks الزامی است" }, { status: 400 });

    const fixedHost = hosts[0] ?? "";
    if (!fixedHost)
      return NextResponse.json({ error: "آدرس سرور الزامی است" }, { status: 400 });

    const pool = (body.portPool ?? []).filter(
      (p) => Number.isInteger(p) && p >= 1 && p <= 65535
    );
    const startIndex = Math.max(0, Math.floor(Number(body.startIndex) || 0));
    const totalDigits = String(
      Math.max(count, Math.floor(Number(body.totalPlanned) || 0))
    ).length;

    const allInputs: ConfigInput[] = [];
    let created = 0;

    for (let chunkStart = 0; chunkStart < count; chunkStart += INSERT_CHUNK) {
      const chunkEnd = Math.min(chunkStart + INSERT_CHUNK, count);
      const values: (typeof configs.$inferInsert)[] = [];

      for (let i = chunkStart; i < chunkEnd; i++) {
        // پروتکل: ثابت یا چرخشی (مخلوط)
        const protocol =
          body.protocol === "mixed"
            ? MIXED_PROTOCOL_CYCLE[i % MIXED_PROTOCOL_CYCLE.length]
            : (body.protocol ?? "vless");

        let port = 443;
        if (body.portMode === "range") {
          const lo = Math.min(body.portMin ?? 1, body.portMax ?? 65535);
          const hi = Math.max(body.portMin ?? 1, body.portMax ?? 65535);
          port = randInt(lo, hi);
        } else if (body.portMode === "pool" && pool.length) {
          port = pool[i % pool.length];
        } else {
          port = Number(body.port) || 443;
        }

        const host = body.hostMode === "rotate" ? hosts[i % hosts.length] : fixedHost;
        const isXrayId = protocol === "vless" || protocol === "vmess";
        const needsPass = protocol === "trojan" || protocol === "shadowsocks";
        const sni =
          body.sni === "@auto"
            ? randomSni()
            : body.sni?.trim()
              ? body.sni.trim()
              : null;
        const path =
          body.path === "@auto"
            ? randomPath()
            : body.path?.trim()
              ? body.path.trim()
              : "/";

        const input: ConfigInput = {
          name: `${prefix}-${String(startIndex + i + 1).padStart(totalDigits, "0")}`,
          protocol,
          host,
          port,
          security: body.security ?? "tls",
          transport: body.transport ?? "ws",
          sni: protocol === "shadowsocks" ? null : sni,
          hostHeader: body.hostHeader || null,
          path,
          serviceName: body.serviceName || null,
          method: needsPass
            ? protocol === "shadowsocks"
              ? (body.method ?? "chacha20-ietf-poly1305")
              : null
            : null,
          uuid: isXrayId ? newUuid() : null,
          password: needsPass ? randomPassword(14) : null,
          enabled: true,
          extras: {},
        };
        allInputs.push(input);
        values.push({
          name: input.name,
          protocol: input.protocol,
          host: input.host,
          port: input.port,
          uuid: input.uuid,
          password: input.password,
          flow: null,
          security: input.security,
          transport: input.transport,
          sni: input.sni,
          hostHeader: input.hostHeader,
          path: input.path || "/",
          serviceName: input.serviceName,
          method: input.method,
          enabled: true,
          extras: {},
        });
      }

      const inserted = await db.insert(configs).values(values).returning({
        id: configs.id,
      });
      created += inserted.length;
    }

    return NextResponse.json(
      {
        created,
        // لینک‌ها فقط برای دسته‌های کوچک برمی‌گردند؛ برای حجم بزرگ از Export استفاده کنید
        ...(count <= SHARE_LIMIT
          ? { shares: allInputs.map(buildShareLink) }
          : {}),
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در ساخت انبوه", detail: String(e) },
      { status: 500 }
    );
  }
}
