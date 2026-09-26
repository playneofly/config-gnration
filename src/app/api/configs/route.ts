import { NextResponse } from "next/server";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { configs } from "@/db/schema";
import { rowToConfigInput } from "@/lib/rowmap";
import { buildShareLink, validateConfig } from "@/lib/share";
import type { ConfigInput, ConfigWithShare, Protocol } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildFilters(url: URL): SQL | undefined {
  const conds: SQL[] = [];
  const proto = url.searchParams.get("protocol");
  if (proto && proto !== "all") conds.push(eq(configs.protocol, proto as Protocol));
  const q = url.searchParams.get("q")?.trim();
  if (q) {
    const like = or(
      ilike(configs.name, `%${q}%`),
      ilike(configs.host, `%${q}%`)
    );
    if (like) conds.push(like);
  }
  return conds.length ? and(...conds) : undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("pageSize")) || 48)
    );
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

    const items: ConfigWithShare[] = rows.map((row) => {
      const input = rowToConfigInput(row);
      return {
        ...input,
        id: row.id,
        createdAt: new Date(row.createdAt).toISOString(),
        share: buildShareLink(input),
      };
    });

    const total = totalRow.value;
    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "خطا در خواندن کانفیگ‌ها", detail: String(e) },
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
    const [row] = await db
      .insert(configs)
      .values({
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
        extras: c.extras ?? {},
      })
      .returning();
    const input = rowToConfigInput(row);
    return NextResponse.json(
      {
        item: {
          ...input,
          id: row.id,
          createdAt: new Date(row.createdAt).toISOString(),
          share: buildShareLink(input),
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
