import { NextResponse } from "next/server";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { buildShareLink, validateConfig } from "@/lib/share";
import type { ConfigInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: ConfigInput[] };
    const items = body.items ?? [];
    if (!items.length) {
      return NextResponse.json({ error: "موردی برای وارد کردن نیست" }, { status: 400 });
    }
    if (items.length > 2000) {
      return NextResponse.json(
        { error: "حداکثر ۲۰۰۰ کانفیگ در هر بار وارد کنید" },
        { status: 400 }
      );
    }
    const good: (typeof configs.$inferInsert)[] = [];
    const skipped: string[] = [];
    for (const c of items) {
      const errors = validateConfig(c);
      if (errors.length) {
        skipped.push(`${c.name || "بدون‌نام"}: ${errors[0]}`);
        continue;
      }
      good.push({
        name: c.name.trim(),
        protocol: c.protocol,
        host: c.host.trim(),
        port: c.port,
        uuid: c.uuid || null,
        password: c.password || null,
        flow: c.flow || null,
        security: c.security ?? "tls",
        transport: c.transport ?? "ws",
        sni: c.sni || null,
        hostHeader: c.hostHeader || null,
        path: c.path || "/",
        serviceName: c.serviceName || null,
        method: c.method || null,
        publicKey: c.publicKey || null,
        privateKey: c.privateKey || null,
        localAddress: c.localAddress || null,
        reserved: c.reserved || null,
        mtu: c.mtu ?? null,
        enabled: true,
        extras: c.extras ?? {},
      });
    }
    const inserted = good.length
      ? await db.insert(configs).values(good).returning({ id: configs.id })
      : [];
    return NextResponse.json(
      { created: inserted.length, skipped, sample: good.slice(0, 3).map((g) => buildShareLink(g as ConfigInput)) },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در وارد کردن", detail: String(e) },
      { status: 500 }
    );
  }
}
