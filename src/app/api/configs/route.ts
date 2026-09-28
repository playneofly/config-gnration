import { NextResponse } from "next/server";
import { and, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { buildShareLink, validateConfig } from "@/lib/share";
import { fingerprint, rowToConfigWithShare } from "@/lib/sync";
import type { ConfigInput } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildFilters(url: URL): SQL | undefined {
  const conds: SQL[] = [];
  const proto = url.searchParams.get("protocol");
  if (proto && proto !== "all") conds.push(eq(configs.protocol, proto));

  const alive = url.searchParams.get("alive");
  if (alive === "alive") conds.push(eq(configs.alive, true));
  else if (alive === "dead") conds.push(eq(configs.alive, false));
  else if (alive === "unknown") conds.push(isNull(configs.alive));

  const q = url.searchParams.get("q")?.trim();
  if (q) {
    const like = or(ilike(configs.name, `%${q}%`), ilike(configs.host, `%${q}%`));
    if (like) conds.push(like);
  }
  return conds.length ? and(...conds) : undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 24));
    const where = buildFilters(url);

    const [rows, [totalRow]] = await Promise.all([
      db
        .select()
        .from(configs)
        .where(where)
        .orderBy(desc(configs.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ value: count() }).from(configs).where(where),
    ]);

    const items = rows.map(rowToConfigWithShare);
    const total = totalRow?.value ?? 0;

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasMore: page * pageSize < total,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در دریافت کانفیگ‌ها", detail: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ConfigInput>;
    const errors = validateConfig(body);
    if (errors.length) {
      return NextResponse.json({ error: errors.join("، ") }, { status: 400 });
    }
    const c = body as ConfigInput;
    const shareInput: ConfigInput = { ...c, enabled: c.enabled ?? true };
    const fp = fingerprint(shareInput);

    const [row] = await db
      .insert(configs)
      .values({
        fingerprint: fp,
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
        enabled: c.enabled ?? true,
        source: "manual",
        rawLink: c.rawLink || null,
        extras: c.extras ?? {},
      })
      .onConflictDoNothing({ target: configs.fingerprint })
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "این کانفیگ قبلاً در دیتابیس وجود دارد" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        item: {
          ...rowToConfigWithShare(row),
          share: buildShareLink(shareInput),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در ساخت کانفیگ", detail: String(e) },
      { status: 500 }
    );
  }
}
