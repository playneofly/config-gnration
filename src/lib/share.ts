import type { ConfigInput, Protocol } from "./types";

/* ---------- Base64 (unicode-safe، سازگار با سرور و کلاینت) ---------- */
export function b64encode(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64");
  }
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function b64decode(input: string): string {
  let normalized = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  while (normalized.length % 4) normalized += "=";
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }
  const bin = atob(normalized);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function b64UrlSafe(input: string): string {
  return b64encode(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ---------- ساخت لینک اشتراک ---------- */
function tag(name: string): string {
  return `#${encodeURIComponent(name)}`;
}

export function buildVlessLink(c: ConfigInput): string {
  const qs = new URLSearchParams();
  qs.set("security", c.security);
  qs.set("encryption", "none");
  qs.set("type", c.transport);
  if (c.path && (c.transport === "ws" || c.transport === "httpupgrade")) qs.set("path", c.path);
  if (c.hostHeader && (c.transport === "ws" || c.transport === "httpupgrade"))
    qs.set("host", c.hostHeader);
  if (c.transport === "grpc" && c.serviceName) qs.set("serviceName", c.serviceName);
  if (c.sni && c.security !== "none") qs.set("sni", c.sni);
  if (c.flow) qs.set("flow", c.flow);
  if (c.security === "reality") {
    if (c.publicKey) qs.set("pbk", c.publicKey);
    if (c.extras?.shortId) qs.set("sid", c.extras.shortId);
    qs.set("fp", c.extras?.fp ?? "chrome");
  }
  if (c.extras?.alpn) qs.set("alpn", c.extras.alpn);
  if (c.transport === "tcp" && c.extras?.headerType) qs.set("headerType", c.extras.headerType);
  return `vless://${c.uuid}@${c.host}:${c.port}?${qs.toString()}${tag(c.name)}`;
}

export function buildVmessLink(c: ConfigInput): string {
  const payload: Record<string, string> = {
    v: "2",
    ps: c.name,
    add: c.host,
    port: String(c.port),
    id: c.uuid ?? "",
    aid: "0",
    scy: c.extras?.scy ?? "auto",
    net: c.transport === "udp" ? "tcp" : c.transport,
    type: "none",
    host: c.hostHeader || c.sni || "",
    path: c.transport === "grpc" ? c.serviceName || "" : c.path || "",
    tls: c.security === "tls" ? "tls" : c.security === "reality" ? "reality" : "",
    sni: c.sni || "",
  };
  return `vmess://${b64encode(JSON.stringify(payload))}`;
}

export function buildTrojanLink(c: ConfigInput): string {
  const qs = new URLSearchParams();
  qs.set("security", c.security === "none" ? "none" : "tls");
  qs.set("type", c.transport === "udp" ? "tcp" : c.transport);
  if (c.path && (c.transport === "ws" || c.transport === "httpupgrade")) qs.set("path", c.path);
  if (c.hostHeader && (c.transport === "ws" || c.transport === "httpupgrade"))
    qs.set("host", c.hostHeader);
  if (c.transport === "grpc" && c.serviceName) qs.set("serviceName", c.serviceName);
  if (c.sni) qs.set("sni", c.sni);
  return `trojan://${encodeURIComponent(c.password ?? "")}@${c.host}:${c.port}?${qs.toString()}${tag(c.name)}`;
}

export function buildShadowsocksLink(c: ConfigInput): string {
  const user = b64UrlSafe(`${c.method}:${c.password}`);
  return `ss://${user}@${c.host}:${c.port}${tag(c.name)}`;
}

export function buildWireguardLink(c: ConfigInput): string {
  const qs = new URLSearchParams();
  if (c.publicKey) qs.set("publickey", c.publicKey);
  if (c.localAddress) qs.set("address", c.localAddress);
  if (c.reserved) qs.set("reserved", c.reserved);
  if (c.mtu) qs.set("mtu", String(c.mtu));
  qs.set("keepalive", "25");
  return `wireguard://${encodeURIComponent(c.privateKey ?? "")}@${c.host}:${c.port}?${qs.toString()}${tag(c.name)}`;
}

export function buildShareLink(c: ConfigInput): string {
  // لینک خام برای پروتکل‌های pass-through (hy2, tuic, ssr و موارد ذخیره‌شده از منابع)
  if (c.rawLink) return c.rawLink;
  switch (c.protocol) {
    case "vless":
      return buildVlessLink(c);
    case "vmess":
      return buildVmessLink(c);
    case "trojan":
      return buildTrojanLink(c);
    case "shadowsocks":
      return buildShadowsocksLink(c);
    case "wireguard":
      return buildWireguardLink(c);
    default:
      return "";
  }
}

export function buildV2raySub(list: ConfigInput[]): string {
  return b64encode(list.map(buildShareLink).filter(Boolean).join("\n"));
}

export function buildRawSub(list: ConfigInput[]): string {
  return list.map(buildShareLink).filter(Boolean).join("\n");
}

/* ---------- اعتبارسنجی ---------- */
export function validateConfig(c: Partial<ConfigInput>): string[] {
  const errors: string[] = [];
  if (!c.name || !c.name.trim()) errors.push("نام کانفیگ الزامی است");
  if (!c.host || !c.host.trim()) errors.push("آدرس سرور الزامی است");
  if (
    typeof c.port !== "number" ||
    !Number.isInteger(c.port) ||
    c.port < 1 ||
    c.port > 65535
  )
    errors.push("پورت باید عددی بین ۱ تا ۶۵۵۳۵ باشد");
  if ((c.protocol === "vless" || c.protocol === "vmess") && !c.uuid)
    errors.push("UUID الزامی است");
  if ((c.protocol === "trojan" || c.protocol === "shadowsocks") && !c.password)
    errors.push("رمز عبور الزامی است");
  if (c.protocol === "shadowsocks" && !c.method)
    errors.push("روش رمزنگاری Shadowsocks الزامی است");
  if (c.protocol === "wireguard" && (!c.privateKey || !c.publicKey))
    errors.push("کلید خصوصی و عمومی WireGuard الزامی است");
  if (c.security === "reality" && c.protocol === "vless" && !c.publicKey)
    errors.push("برای Reality کلید عمومی (pbk) الزامی است");
  return errors;
}

/* ---------- پارس لینک‌ها ---------- */
function emptyBase(name: string, protocol: Protocol): ConfigInput {
  return {
    name,
    protocol,
    host: "",
    port: 443,
    security: "tls",
    transport: "ws",
    enabled: true,
    path: "/",
    extras: {},
  };
}

function decodeName(hash: string, fallback: string): string {
  try {
    return decodeURIComponent(hash.replace(/^#/, "")) || fallback;
  } catch {
    return fallback;
  }
}

export function parseShareLink(raw: string): ConfigInput {
  const link = raw.trim();
  const scheme = link.split("://")[0]?.toLowerCase();

  if (scheme === "vless" || scheme === "trojan") {
    const u = new URL(link);
    const proto = scheme as Protocol;
    const base = emptyBase(decodeName(u.hash, `${u.hostname}:${u.port}`), proto);
    base.host = u.hostname;
    base.port = Number(u.port) || 443;
    const q = u.searchParams;
    base.transport = (q.get("type") as ConfigInput["transport"]) || "tcp";
    const sec = q.get("security");
    base.security = sec === "reality" ? "reality" : sec === "none" ? "none" : "tls";
    base.path = q.get("path") || "";
    base.hostHeader = q.get("host") || "";
    base.serviceName = q.get("serviceName") || "";
    base.sni = q.get("sni") || "";
    if (proto === "vless") {
      base.uuid = decodeURIComponent(u.username);
      base.flow = q.get("flow") || "";
      if (q.get("pbk")) base.publicKey = q.get("pbk");
      const extras: Record<string, string> = {};
      if (q.get("sid")) extras.shortId = q.get("sid")!;
      if (q.get("fp")) extras.fp = q.get("fp")!;
      if (q.get("alpn")) extras.alpn = q.get("alpn")!;
      if (q.get("headerType")) extras.headerType = q.get("headerType")!;
      base.extras = extras;
    } else {
      base.password = decodeURIComponent(u.username);
    }
    return base;
  }

  if (scheme === "vmess") {
    const json = JSON.parse(b64decode(link.slice("vmess://".length)));
    const base = emptyBase(json.ps || `${json.add}:${json.port}`, "vmess");
    base.host = json.add;
    base.port = Number(json.port) || 443;
    base.uuid = json.id;
    base.transport = (json.net as ConfigInput["transport"]) || "tcp";
    base.security = json.tls === "tls" ? "tls" : "none";
    base.sni = json.sni || "";
    base.hostHeader = json.host || "";
    if (base.transport === "grpc") base.serviceName = json.path || "";
    else base.path = json.path || "";
    return base;
  }

  if (scheme === "ss") {
    const body = link.slice("ss://".length);
    const hashIdx = body.indexOf("#");
    const name = hashIdx >= 0 ? decodeName(body.slice(hashIdx), "Shadowsocks") : "Shadowsocks";
    const clean = hashIdx >= 0 ? body.slice(0, hashIdx) : body;
    const base = emptyBase(name, "shadowsocks");
    base.security = "none";
    base.transport = "tcp";

    const atIdx = clean.lastIndexOf("@");
    const userPart = atIdx >= 0 ? clean.slice(0, atIdx) : clean;
    const hostPart = atIdx >= 0 ? clean.slice(atIdx + 1) : "";

    // تلاش برای SIP002: ss://method:pass@host:port (بدون base64)
    if (atIdx >= 0 && userPart.includes(":") && !looksLikeBase64(userPart)) {
      const colon = userPart.indexOf(":");
      base.method = decodeURIComponent(userPart.slice(0, colon));
      base.password = decodeURIComponent(userPart.slice(colon + 1));
    } else {
      let decoded = userPart;
      try {
        decoded = b64decode(userPart);
      } catch {
        decoded = decodeURIComponent(userPart);
      }
      const colon = decoded.indexOf(":");
      base.method = decoded.slice(0, colon);
      base.password = decoded.slice(colon + 1);
    }
    const hp = hostPart.match(/^(.+?):(\d+)/);
    if (hp) {
      base.host = hp[1].replace(/^\[|\]$/g, "");
      base.port = Number(hp[2]);
    }
    if (!base.host || !base.method || !base.password) throw new Error("ss invalid");
    return base;
  }

  if (scheme === "wireguard") {
    const u = new URL(link);
    const base = emptyBase(decodeName(u.hash, `${u.hostname}:${u.port}`), "wireguard");
    base.host = u.hostname;
    base.port = Number(u.port) || 1701;
    base.privateKey = decodeURIComponent(u.username);
    base.publicKey = u.searchParams.get("publickey") || "";
    base.localAddress = u.searchParams.get("address") || "";
    base.reserved = u.searchParams.get("reserved") || "";
    base.mtu = Number(u.searchParams.get("mtu")) || null;
    base.security = "none";
    base.transport = "udp";
    return base;
  }

  if (scheme === "hysteria2" || scheme === "hy2" || scheme === "tuic" || scheme === "ssr") {
    // pass-through: لینک را دست‌نخورده نگه می‌داریم تا کلاینت خودش مدیریت کند
    let host = "";
    let port = 443;
    let name = "";
    let password: string | null = null;
    if (scheme === "ssr") {
      name = "SSR";
      try {
        const decoded = b64decode(link.slice("ssr://".length));
        const main = decoded.split("/?")[0];
        const parts = main.split(":");
        if (parts.length >= 6) {
          host = parts[0];
          port = Number(parts[1]) || 443;
          password = b64decode(parts[5].replace(/-/g, "+").replace(/_/g, "/"));
        }
        const obfsName = decoded.match(/remarks=([^&]+)/);
        if (obfsName) name = b64decode(obfsName[1].replace(/-/g, "+").replace(/_/g, "/"));
      } catch {
        /* keep raw */
      }
    } else {
      try {
        const u = new URL(link);
        host = u.hostname;
        port = Number(u.port) || 443;
        name = decodeName(u.hash, `${host}:${port}`);
        password = decodeURIComponent(u.username || "") || u.searchParams.get("password");
      } catch {
        /* keep raw */
      }
    }
    const proto: Protocol = scheme === "hy2" ? "hysteria2" : (scheme as Protocol);
    return {
      ...emptyBase(name || `${host}:${port}`, proto),
      host,
      port,
      password,
      security: "tls",
      transport: scheme === "ssr" ? "tcp" : "udp",
      rawLink: link,
    };
  }

  throw new Error(`پروتکل «${scheme || "نامشخص"}» پشتیبانی نمی‌شود`);
}

function looksLikeBase64(s: string): boolean {
  return /^[A-Za-z0-9+/=_-]+$/.test(s) && !s.includes("%");
}

export function parseShareLinks(text: string): {
  configs: ConfigInput[];
  failed: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const configs: ConfigInput[] = [];
  const failed: string[] = [];
  for (const line of lines) {
    try {
      configs.push(parseShareLink(line));
    } catch {
      failed.push(line.slice(0, 80));
    }
  }
  return { configs, failed };
}
