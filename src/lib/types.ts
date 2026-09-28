export type Protocol =
  | "vless"
  | "vmess"
  | "trojan"
  | "shadowsocks"
  | "wireguard"
  | "hysteria2"
  | "tuic"
  | "ssr"
  | "other";

export type Security = "tls" | "none" | "reality";
export type Transport = "ws" | "tcp" | "grpc" | "httpupgrade" | "udp";

export interface ConfigInput {
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  uuid?: string | null;
  password?: string | null;
  flow?: string | null;
  security: Security;
  transport: Transport;
  sni?: string | null;
  hostHeader?: string | null;
  path?: string | null;
  serviceName?: string | null;
  method?: string | null;
  publicKey?: string | null;
  privateKey?: string | null;
  localAddress?: string | null;
  reserved?: string | null;
  mtu?: number | null;
  enabled?: boolean;
  rawLink?: string | null;
  extras?: Record<string, string>;
}

export interface ConfigWithShare extends ConfigInput {
  id: number;
  share: string;
  alive: boolean | null;
  latency: number | null;
  source: string;
  lastTestedAt: string | null;
  createdAt: string;
}

export interface SyncSourceResult {
  name: string;
  url: string;
  ok: boolean;
  lines: number;
  error?: string;
}

export interface SyncReport {
  fetchedLines: number;
  parsed: number;
  inserted: number;
  duplicates: number;
  failed: number;
  tested: number;
  aliveCount: number;
  sources: SyncSourceResult[];
  durationMs: number;
}
