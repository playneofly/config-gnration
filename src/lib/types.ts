export type Protocol =
  | "vless"
  | "vmess"
  | "trojan"
  | "shadowsocks"
  | "wireguard";

export type Transport = "ws" | "tcp" | "grpc" | "httpupgrade";
export type Security = "tls" | "none" | "reality";

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
  enabled: boolean;
  extras?: Record<string, string>;
}

export interface ConfigWithShare extends ConfigInput {
  id: number;
  createdAt: string;
  share: string;
}

export interface SubscriptionDto {
  id: number;
  name: string;
  token: string;
  mode: "all" | "selected";
  configIds: number[];
  createdAt: string;
  count?: number;
}

export interface ParsedImport {
  ok: boolean;
  error?: string;
  raw: string;
  config?: ConfigInput;
}

export type SubFormat = "v2ray" | "singbox" | "clash" | "raw";
