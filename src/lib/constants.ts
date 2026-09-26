import type { Protocol, Security, Transport } from "./types";

export const PROTOCOL_META: Record<
  Protocol,
  {
    label: string;
    desc: string;
    defaultPort: number;
    badge: string;
    dot: string;
    glow: string;
  }
> = {
  vless: {
    label: "VLESS",
    desc: "سبک، سریع و استاندارد جدید هسته Xray",
    defaultPort: 443,
    badge: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30",
    dot: "bg-cyan-400",
    glow: "from-cyan-500/25",
  },
  vmess: {
    label: "VMess",
    desc: "پروتکل کلاسیک و سازگار با همه کلاینت‌ها",
    defaultPort: 443,
    badge: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
    dot: "bg-violet-400",
    glow: "from-violet-500/25",
  },
  trojan: {
    label: "Trojan",
    desc: "شبیه‌سازی کامل ترافیک HTTPS با رمز عبور",
    defaultPort: 443,
    badge: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
    dot: "bg-rose-400",
    glow: "from-rose-500/25",
  },
  shadowsocks: {
    label: "Shadowsocks",
    desc: "پروکسی رمزنگاری‌شده سبک با پشتیبانی گسترده",
    defaultPort: 8388,
    badge: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
    dot: "bg-amber-400",
    glow: "from-amber-500/25",
  },
  wireguard: {
    label: "WireGuard",
    desc: "مناسب ساخت کانفیگ WARP و تونل‌های سریع",
    defaultPort: 1701,
    badge: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
    dot: "bg-emerald-400",
    glow: "from-emerald-500/25",
  },
};

export const PROTOCOL_LIST = Object.keys(PROTOCOL_META) as Protocol[];

export const TRANSPORT_META: Record<Transport, { label: string }> = {
  ws: { label: "WebSocket" },
  tcp: { label: "TCP" },
  grpc: { label: "gRPC" },
  httpupgrade: { label: "HTTP Upgrade" },
};

export const SECURITY_META: Record<Security, { label: string }> = {
  tls: { label: "TLS" },
  none: { label: "بدون رمزنگاری لایه" },
  reality: { label: "Reality" },
};

export const SS_CIPHERS = [
  "aes-128-gcm",
  "aes-256-gcm",
  "chacha20-ietf-poly1305",
  "xchacha20-ietf-poly1305",
  "2022-blake3-aes-128-gcm",
  "2022-blake3-aes-256-gcm",
  "2022-blake3-chacha20-poly1305",
];

export const VLESS_FLOWS = ["", "xtls-rprx-vision"];

// مجموعه‌ای از آی‌پی‌های معروف و پراستفاده کلادفلر به‌عنوان پیش‌فرض ساخت انبوه
export const CLEAN_HOSTS_PRESET = [
  "104.16.1.1",
  "104.16.202.9",
  "104.17.154.40",
  "104.18.11.214",
  "104.19.127.35",
  "104.20.12.56",
  "104.21.25.178",
  "104.24.197.20",
  "162.159.192.10",
  "162.159.198.4",
  "188.114.96.3",
  "188.114.97.7",
  "172.67.73.163",
  "172.64.155.141",
];

export const POPULAR_PORTS = [443, 8443, 2053, 2083, 2087, 2096, 8080, 2052];
