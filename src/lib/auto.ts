import { CLEAN_HOSTS_PRESET, SS_CIPHERS } from "./constants";
import { newUuid, randInt, randomPassword } from "./utils";
import type { ConfigInput, Protocol, Security, Transport } from "./types";

/* ---------- مخزن‌های خودکار ---------- */

/** دامنه‌های معتبر و پرترافیک مناسب SNI */
export const SNI_POOL = [
  "speedtest.net",
  "www.speedtest.net",
  "www.cloudflare.com",
  "discord.com",
  "cdn.discordapp.com",
  "gateway.discord.gg",
  "www.google.com",
  "dl.google.com",
  "github.com",
  "www.microsoft.com",
  "statics.teams.cdn.office.net",
  "updates.cdn-apple.com",
  "www.yahoo.com",
  "fastly.net",
];

const PATH_WORDS = [
  "ws",
  "ray",
  "xray",
  "v2",
  "cdn",
  "api",
  "graphql",
  "socket",
  "stream",
  "live",
  "media",
  "edge",
];

const NAME_WORDS = [
  "آلمان",
  "هلند",
  "فرانسه",
  "فنلاند",
  "انگلیس",
  "آمریکا",
  "سنگاپور",
  "ژاپن",
  "ترکیه",
  "کانادا",
  "سوئد",
  "اتریش",
];

const TLS_PORTS = [443, 8443, 2053, 2083, 2087, 2096];
const WG_PORTS = [2408, 1701, 4500, 500, 8854];

/* ---------- توابع کمکی ---------- */

export function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

function hex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

function b64UrlKey(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(arr).toString("base64");
  }
  let bin = "";
  arr.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

export function randomSni(): string {
  return pick(SNI_POOL);
}

export function randomPath(): string {
  return `/${pick(PATH_WORDS)}-${hex(4)}`;
}

export function randomHost(): string {
  return pick(CLEAN_HOSTS_PRESET);
}

export function randomTlsPort(): number {
  return pick(TLS_PORTS);
}

export function autoName(): string {
  return `${pick(NAME_WORDS)} ${randInt(100, 999)}`;
}

/* ---------- تولید کانفیگ کاملاً خودکار ---------- */

const WEIGHTED_PROTOCOLS: Protocol[] = [
  "vless",
  "vless",
  "vless",
  "vless",
  "trojan",
  "trojan",
  "trojan",
  "vmess",
  "vmess",
  "shadowsocks",
  "shadowsocks",
  "wireguard",
];

export function generateAutoConfig(
  forceProtocol: Protocol | "random" = "random"
): ConfigInput {
  const protocol: Protocol =
    forceProtocol === "random" ? pick(WEIGHTED_PROTOCOLS) : forceProtocol;

  const base: ConfigInput = {
    name: autoName(),
    protocol,
    host: randomHost(),
    port: randomTlsPort(),
    security: "tls",
    transport: "ws",
    enabled: true,
    extras: {},
  };

  switch (protocol) {
    case "vless": {
      const useTls = Math.random() < 0.85;
      // بیشتر WS، گاهی gRPC یا HTTP Upgrade
      const r = Math.random();
      const transport: Transport = r < 0.75 ? "ws" : r < 0.88 ? "grpc" : "httpupgrade";
      return {
        ...base,
        uuid: newUuid(),
        security: useTls ? "tls" : "none",
        transport,
        sni: useTls ? randomSni() : null,
        path: transport === "grpc" ? null : randomPath(),
        serviceName: transport === "grpc" ? pick(PATH_WORDS) : null,
        hostHeader:
          transport !== "grpc" && Math.random() < 0.3 ? randomSni() : null,
      };
    }
    case "vmess": {
      const useTls = Math.random() < 0.85;
      return {
        ...base,
        uuid: newUuid(),
        security: useTls ? "tls" : "none",
        transport: "ws",
        sni: useTls ? randomSni() : null,
        path: randomPath(),
        hostHeader: Math.random() < 0.35 ? randomSni() : null,
      };
    }
    case "trojan": {
      const transport: Transport = Math.random() < 0.7 ? "ws" : "grpc";
      return {
        ...base,
        password: randomPassword(16),
        security: "tls",
        transport,
        sni: randomSni(),
        path: transport === "ws" ? randomPath() : null,
        serviceName: transport === "grpc" ? pick(PATH_WORDS) : null,
      };
    }
    case "shadowsocks":
      return {
        ...base,
        port: pick([8388, 443, 853, 8080]),
        password: randomPassword(18),
        method: pick(SS_CIPHERS.slice(0, 4)),
        security: "none",
        transport: "tcp",
      };
    case "wireguard": {
      const reserved = `${randInt(0, 255)},${randInt(0, 255)},${randInt(0, 255)}`;
      return {
        ...base,
        host: "engage.cloudflareclient.com",
        port: pick(WG_PORTS),
        privateKey: b64UrlKey(),
        publicKey: "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
        localAddress: `172.16.0.${randInt(2, 254)}/32`,
        reserved,
        mtu: 1280,
        security: "none",
        transport: "tcp",
      };
    }
  }
}

/** برای ساخت انبوه با پروتکل چرخشی */
export const MIXED_PROTOCOL_CYCLE: Protocol[] = [
  "vless",
  "trojan",
  "vmess",
  "shadowsocks",
];
