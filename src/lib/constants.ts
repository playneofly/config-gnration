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
    glow: "from-cyan-400/60",
  },
  vmess: {
    label: "VMess",
    desc: "پروتکل کلاسیک و سازگار با همه‌ی کلاینت‌ها",
    defaultPort: 443,
    badge: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
    dot: "bg-violet-400",
    glow: "from-violet-400/60",
  },
  trojan: {
    label: "Trojan",
    desc: "شبیه‌سازی کامل ترافیک HTTPS با رمز عبور",
    defaultPort: 443,
    badge: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
    dot: "bg-rose-400",
    glow: "from-rose-400/60",
  },
  shadowsocks: {
    label: "Shadowsocks",
    desc: "پروکسی رمزنگاری‌شده‌ی سبک با پشتیبانی گسترده",
    defaultPort: 8388,
    badge: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
    dot: "bg-amber-400",
    glow: "from-amber-400/60",
  },
  wireguard: {
    label: "WireGuard",
    desc: "تونل سریع لایه‌ی سه، مناسب WARP",
    defaultPort: 1701,
    badge: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
    dot: "bg-emerald-400",
    glow: "from-emerald-400/60",
  },
  hysteria2: {
    label: "Hysteria2",
    desc: "مبتنی بر QUIC با سرعت بالا روی شبکه‌های ضعیف",
    defaultPort: 443,
    badge: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
    dot: "bg-sky-400",
    glow: "from-sky-400/60",
  },
  tuic: {
    label: "TUIC",
    desc: "پروتکل مدرن مبتنی بر QUIC",
    defaultPort: 443,
    badge: "bg-indigo-400/10 text-indigo-300 ring-indigo-400/30",
    dot: "bg-indigo-400",
    glow: "from-indigo-400/60",
  },
  ssr: {
    label: "SSR",
    desc: "ShadowsocksR با obfs",
    defaultPort: 8388,
    badge: "bg-orange-400/10 text-orange-300 ring-orange-400/30",
    dot: "bg-orange-400",
    glow: "from-orange-400/60",
  },
  other: {
    label: "سایر",
    desc: "لینک خام بدون تغییر",
    defaultPort: 443,
    badge: "bg-zinc-400/10 text-zinc-300 ring-zinc-400/30",
    dot: "bg-zinc-400",
    glow: "from-zinc-400/60",
  },
};

export const PROTOCOL_LIST = Object.keys(PROTOCOL_META) as Protocol[];

export const TRANSPORT_META: Record<Transport, { label: string }> = {
  ws: { label: "WebSocket" },
  tcp: { label: "TCP" },
  grpc: { label: "gRPC" },
  httpupgrade: { label: "HTTP Upgrade" },
  udp: { label: "UDP" },
};

export const SECURITY_META: Record<Security, { label: string }> = {
  tls: { label: "TLS" },
  none: { label: "بدون TLS" },
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

export const SUPPORTED_SCHEMES = [
  "vless",
  "vmess",
  "trojan",
  "ss",
  "ssr",
  "wireguard",
  "hysteria2",
  "hy2",
  "tuic",
];

/** میزبان‌های تمیز (پشت شبکه‌ی کلادفلر) مناسب برای آدرس/هاست کانفیگ */
export const CLEAN_HOSTS_PRESET = [
  "www.speedtest.net",
  "speedtest.net",
  "www.cloudflare.com",
  "discord.com",
  "cdn.discordapp.com",
  "zula.ir",
  "icook.hk",
  "go.inmobi.com",
];
