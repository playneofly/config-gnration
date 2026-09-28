import { NextResponse } from "next/server";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { b64decode, parseShareLinks } from "@/lib/share";
import { fingerprint } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** وارد کردن دستی لینک‌ها (متن خام یا محتوای base64 سابسکریپشن) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: string };
    let text = (body.text ?? "").trim();
    if (!text) return NextResponse.json({ error: "متنی ارسال نشده است" }, { status: 400 });

    // اگر کل متن base64 باشد، decode کن
    if (!text.includes("://")) {
      try {
        const decoded = b64decode(text.replace(/\s/g, ""));
        if (decoded.includes("://")) text = decoded;
      } catch {
        /* ignore */
      }
    }

    if (text.length > 2_000_000) {
      return NextResponse.json({ error: "حجم متن بیش از حد زیاد است" }, { status: 413 });
    }

    const { configs: parsed, failed } = parseShareLinks(text);
    if (!parsed.length) {
      return NextResponse.json(
        { error: "هیچ لینک معتبری پیدا نشد", failed: failed.length },
        { status: 400 }
      );
    }

    let inserted = 0;
    const CHUNK = 150;
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK);
      const result = await db
        .insert(configs)
        .values(
          chunk.map((c) => ({
            fingerprint: fingerprint(c),
            name: (c.name || `${c.host}:${c.port}`).slice(0, 180),
            protocol: c.protocol,
            host: c.host,
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
            source: "import",
            rawLink: c.rawLink || null,
            extras: c.extras ?? {},
          }))
        )
        .onConflictDoNothing({ target: configs.fingerprint })
        .returning({ id: configs.id });
      inserted += result.length;
    }

    return NextResponse.json({
      ok: true,
      parsed: parsed.length,
      inserted,
      duplicates: parsed.length - inserted,
      failed: failed.length,
    });
  } catch (e) {
    return NextResponse.json({ error: "خطا در وارد کردن", detail: String(e) }, { status: 500 });
  }
}
