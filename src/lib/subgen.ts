import type { ConfigInput } from "./types";

/* ---------- sing-box (JSON) ---------- */

function sbTransport(c: ConfigInput): Record<string, unknown> | undefined {
  switch (c.transport) {
    case "ws":
      return {
        type: "ws",
        path: c.path || "/",
        ...(c.hostHeader ? { headers: { Host: c.hostHeader } } : {}),
      };
    case "grpc":
      return { type: "grpc", service_name: c.serviceName || "" };
    case "httpupgrade":
      return {
        type: "httpupgrade",
        path: c.path || "/",
        ...(c.hostHeader ? { host: c.hostHeader } : {}),
      };
    default:
      return undefined;
  }
}

function sbTls(c: ConfigInput): Record<string, unknown> | undefined {
  if (c.security === "none") return undefined;
  const tls: Record<string, unknown> = {
    enabled: true,
    server_name: c.sni || c.host,
  };
  if (c.security === "reality") {
    tls.utls = { enabled: true, fingerprint: c.extras?.fp || "chrome" };
    tls.reality = {
      enabled: true,
      public_key: c.publicKey || "",
      short_id: c.extras?.shortId || "",
    };
  }
  if (c.extras?.alpn) tls.alpn = c.extras.alpn.split(",");
  return tls;
}

function sbOutbound(c: ConfigInput): Record<string, unknown> | null {
  const base = {
    tag: c.name,
    server: c.host,
    server_port: c.port,
  };
  switch (c.protocol) {
    case "vless":
      return {
        type: "vless",
        ...base,
        uuid: c.uuid,
        ...(c.flow ? { flow: c.flow } : {}),
        ...(sbTls(c) ? { tls: sbTls(c) } : {}),
        ...(sbTransport(c) ? { transport: sbTransport(c) } : {}),
      };
    case "vmess":
      return {
        type: "vmess",
        ...base,
        uuid: c.uuid,
        security: "auto",
        ...(sbTls(c) ? { tls: sbTls(c) } : {}),
        ...(sbTransport(c) ? { transport: sbTransport(c) } : {}),
      };
    case "trojan":
      return {
        type: "trojan",
        ...base,
        password: c.password,
        ...(sbTls(c) ? { tls: sbTls(c) } : {}),
        ...(sbTransport(c) ? { transport: sbTransport(c) } : {}),
      };
    case "shadowsocks":
      return {
        type: "shadowsocks",
        ...base,
        method: c.method,
        password: c.password,
      };
    case "wireguard": {
      const local = (c.localAddress || "172.16.0.2/32")
        .split(",")
        .map((s) => s.trim());
      return {
        type: "wireguard",
        ...base,
        local_address: local,
        private_key: c.privateKey,
        peer_public_key: c.publicKey,
        ...(c.reserved
          ? { reserved: c.reserved.split(",").map((n) => Number(n.trim())) }
          : {}),
        ...(c.mtu ? { mtu: c.mtu } : {}),
      };
    }
    case "hysteria2":
      return {
        type: "hysteria2",
        ...base,
        password: c.password,
        ...(sbTls(c) ? { tls: sbTls(c) } : {}),
      };
    case "tuic":
      return {
        type: "tuic",
        ...base,
        uuid: c.uuid,
        password: c.password,
        ...(sbTls(c) ? { tls: sbTls(c) } : {}),
      };
    default:
      return null;
  }
}

export function buildSingBoxConfig(configs: ConfigInput[]): string {
  const outs = configs
    .map((c) => ({ c, outbound: sbOutbound(c) }))
    .filter((x): x is { c: ConfigInput; outbound: Record<string, unknown> } =>
      Boolean(x.outbound)
    );
  const tags = outs.map((x) => x.c.name);
  const doc = {
    log: { level: "warn", timestamp: true },
    dns: {
      servers: [
        { tag: "remote", address: "https://1.1.1.1/dns-query" },
        { tag: "local", address: "223.5.5.5", detour: "direct" },
      ],
    },
    inbounds: [
      {
        type: "mixed",
        tag: "mixed-in",
        listen: "0.0.0.0",
        listen_port: 2080,
      },
    ],
    outbounds: [
      {
        type: "selector",
        tag: "PROXY",
        outbounds: ["AUTO", ...tags, "direct"],
        default: "AUTO",
      },
      {
        type: "urltest",
        tag: "AUTO",
        outbounds: tags,
        url: "https://www.gstatic.com/generate_204",
        interval: "10m",
        tolerance: 50,
      },
      ...outs.map((x) => x.outbound),
      { type: "direct", tag: "direct" },
    ],
  };
  return JSON.stringify(doc, null, 2);
}

/* ---------- Clash / Clash Meta (YAML) ---------- */

function yq(value: unknown): string {
  // خروجی flow-style سازگار با YAML (JSON زیرمجموعه YAML است)
  return JSON.stringify(value);
}

function clashProxy(c: ConfigInput): Record<string, unknown> | null {
  const base = {
    name: c.name,
    server: c.host,
    port: c.port,
    udp: true,
  };
  const wsOpts =
    c.transport === "ws"
      ? {
          "ws-opts": {
            path: c.path || "/",
            ...(c.hostHeader ? { headers: { Host: c.hostHeader } } : {}),
          },
        }
      : {};
  switch (c.protocol) {
    case "vless":
      return {
        ...base,
        type: "vless",
        uuid: c.uuid,
        tls: c.security !== "none",
        servername: c.sni || undefined,
        network: c.transport === "httpupgrade" ? "ws" : c.transport,
        ...(c.flow ? { flow: c.flow } : {}),
        ...(c.security === "reality"
          ? {
              "reality-opts": {
                "public-key": c.publicKey || "",
                "short-id": c.extras?.shortId || "",
              },
            }
          : {}),
        ...wsOpts,
      };
    case "vmess":
      return {
        ...base,
        type: "vmess",
        uuid: c.uuid,
        alterId: 0,
        cipher: "auto",
        tls: c.security === "tls",
        servername: c.sni || undefined,
        network: c.transport === "httpupgrade" ? "ws" : c.transport,
        "skip-cert-verify": false,
        ...wsOpts,
      };
    case "trojan":
      return {
        ...base,
        type: "trojan",
        password: c.password,
        sni: c.sni || undefined,
        network: c.transport === "httpupgrade" ? "ws" : c.transport,
        ...wsOpts,
      };
    case "shadowsocks":
      return {
        ...base,
        type: "ss",
        cipher: c.method,
        password: c.password,
      };
    case "wireguard":
      return {
        ...base,
        type: "wireguard",
        ip: (c.localAddress || "172.16.0.2").split(",")[0].split("/")[0],
        "private-key": c.privateKey,
        "public-key": c.publicKey,
        ...(c.mtu ? { mtu: c.mtu } : {}),
      };
    default:
      return null;
  }
}

export function buildClashConfig(configs: ConfigInput[]): string {
  const proxies = configs
    .map(clashProxy)
    .filter((p): p is Record<string, unknown> => Boolean(p));
  const names = proxies.map((p) => p.name as string);
  const lines: string[] = [
    "port: 7890",
    "socks-port: 7891",
    "allow-lan: true",
    "mode: rule",
    "log-level: info",
    'external-controller: "127.0.0.1:9090"',
    "dns:",
    "  enable: true",
    "  ipv6: false",
    "  default-nameserver:",
    "    - 223.5.5.5",
    "    - 8.8.8.8",
    "  nameserver:",
    "    - https://1.1.1.1/dns-query",
    "    - https://dns.google/dns-query",
    "proxies:",
    ...proxies.map((p) => `  - ${yq(p)}`),
    "proxy-groups:",
    `  - ${yq({ name: "PROXY", type: "select", proxies: ["AUTO", ...names, "DIRECT"] })}`,
    `  - ${yq({
      name: "AUTO",
      type: "url-test",
      url: "https://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      proxies: names,
    })}`,
    "rules:",
    "  - GEOIP,LAN,DIRECT",
    "  - GEOIP,CN,DIRECT",
    "  - MATCH,PROXY",
    "",
  ];
  return lines.join("\n");
}
