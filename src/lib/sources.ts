/**
 * منابع عمومی و رایگان اشتراک V2Ray که به‌صورت مرتب (ساعتی) به‌روز می‌شوند.
 * این لیست‌ها حاوی سرورهای واقعی هستند که توسط جامعه نگهداری می‌شوند.
 */
export const PUBLIC_SOURCES: { name: string; url: string }[] = [
  {
    name: "V2RayAggregator",
    url: "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge_base64.txt",
  },
  {
    name: "Epodonios",
    url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/All_Configs_Sub.txt",
  },
  {
    name: "freefq",
    url: "https://raw.githubusercontent.com/freefq/free/master/v2",
  },
  {
    name: "TGParse",
    url: "https://raw.githubusercontent.com/Surfboardv2ray/TGParse/main/configtg.txt",
  },
  {
    name: "Pawdroid",
    url: "https://raw.githubusercontent.com/Pawdroid/Free-servers/main/sub",
  },
  {
    name: "ermaozi",
    url: "https://raw.githubusercontent.com/ermaozi/get_subscribe/main/subscribe/v2ray.txt",
  },
  {
    name: "AutoProxy",
    url: "https://raw.githubusercontent.com/w1770946466/Auto_proxy/main/Long_term_subscription1",
  },
];

const FETCH_TIMEOUT = 14000;

export async function fetchSourceText(
  url: string
): Promise<{ ok: boolean; text: string; error?: string }> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    const res = await fetch(url, {
      signal: ctrl.signal,
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/plain,*/*",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, text: "", error: `HTTP ${res.status}` };
    const text = await res.text();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, text: "", error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * متن منبع را به لیست لینک‌ها تبدیل می‌کند.
 * بعضی منابع base64 هستند و بعضی لینک خام.
 */
export function extractLinks(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const candidateLines = () =>
    trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.includes("://") && !l.startsWith("#"));

  // اگر مستقیم لینک دارد
  if (/:\/\//.test(trimmed.split("\n")[0] ?? "")) {
    return candidateLines();
  }

  // تلاش برای decode کامل base64 — خطوط کامنت (#) اول حذف می‌شوند
  try {
    const compact = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"))
      .join("")
      .replace(/\s/g, "");
    const decoded = decodeBase64Loose(compact);
    if (decoded.includes("://")) {
      return decoded
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.includes("://"));
    }
  } catch {
    /* ignore */
  }

  // بعضی منابع: هر خط یک لینک vmess/ss جدا (خودشان base64 هستند)
  return candidateLines();
}

function decodeBase64Loose(input: string): string {
  let normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  while (normalized.length % 4) normalized += "=";
  return Buffer.from(normalized, "base64").toString("utf8");
}
