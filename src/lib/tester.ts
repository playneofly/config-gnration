import net from "node:net";
import tls from "node:tls";

export interface TestResult {
  alive: boolean;
  latency: number | null;
}

/**
 * پروب واقعی لایه‌ی کاربرد.
 * موفقیتِ صرف TCP connect کافی نیست — بعضی شبکه‌ها پروکسی شفاف دارند که هر
 * اتصالی را accept می‌کند؛ پس بعد از اتصال داده ردوبدل می‌کنیم:
 *  - TLS → هندشیک TLS واقعی با SNI. secureConnect = زنده. خطاهای TLS که نشان‌دهنده
 *    پاسخ واقعی سرورند (wrong version, alert, ...) هم به معنای سرور زنده است.
 *  - غیر TLS → ارسال HTTP GET؛ هر بایت پاسخ یا بستنِ تمیزِ فعالانه = زنده.
 *  - سکوت مطلق تا تایم‌اوت = مرده.
 */
export function probeServer(
  host: string,
  port: number,
  opts: { sni?: string | null; useTls: boolean; timeout?: number }
): Promise<TestResult> {
  const timeout = opts.timeout ?? 2400;
  return opts.useTls ? tlsProbe(host, port, opts.sni ?? undefined, timeout) : rawProbe(host, port, timeout);
}

const DEAD_CODES = new Set([
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ECONNRESET",
  "EAI_AGAIN",
  "EPIPE",
]);

function tlsProbe(host: string, port: number, sni: string | undefined, timeout: number): Promise<TestResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let done = false;

    const socket = tls.connect({
      host,
      port,
      servername: sni && !/^\d+\.\d+\.\d+\.\d+$/.test(sni) ? sni : undefined,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    });

    const finish = (alive: boolean) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ alive, latency: alive ? Date.now() - started : null });
    };

    socket.setTimeout(timeout);
    socket.once("secureConnect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", (err: NodeJS.ErrnoException) => {
      const code = err.code ?? "";
      const msg = err.message ?? "";
      if (DEAD_CODES.has(code)) return finish(false);
      // پاسخ TLS (حتی خطادار) یعنی سرور واقعی پشت پورت است
      const tlsAnswered =
        /wrong version number|unknown protocol|ssl3_read_bytes|tlsv1 alert|handshake failure|packet length too long|certificate|unsupported protocol|http request/i.test(
          msg
        );
      finish(tlsAnswered);
    });
  });
}

function rawProbe(host: string, port: number, timeout: number): Promise<TestResult> {
  return new Promise((resolve) => {
    const started = Date.now();
    let done = false;
    let sentPayload = false;
    const socket = new net.Socket();

    const finish = (alive: boolean) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ alive, latency: alive ? Date.now() - started : null });
    };

    socket.setTimeout(timeout);
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false)); // سکوت مطلق → نامعتبر
    socket.once("data", () => finish(true)); // هر پاسخی → زنده
    socket.once("close", (hadError) => {
      // بستن تمیزِ فعالانه بعد از دریافت پیلود ما → یک سرور واقعی جواب داده
      finish(!hadError && sentPayload);
    });

    socket.once("connect", () => {
      sentPayload = true;
      try {
        socket.write(
          `GET / HTTP/1.1\r\nHost: ${host}\r\nUser-Agent: Mozilla/5.0\r\nConnection: close\r\n\r\n`
        );
      } catch {
        finish(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch {
      finish(false);
    }
  });
}

/** پروب ساده TCP — فقط برای موارد سبک */
export function tcpTest(host: string, port: number, timeout = 1800): Promise<TestResult> {
  return rawProbe(host, port, timeout);
}

/** پروب هوشمند یک ردیف کانفیگ بر اساس نوع امنیت آن */
export function probeConfig(row: {
  host: string;
  port: number;
  security?: string | null;
  sni?: string | null;
}): Promise<TestResult> {
  const useTls = row.security === "tls" || row.security === "reality" || row.port === 443;
  return probeServer(row.host, row.port, { useTls, sni: row.sni, timeout: 2400 });
}

export async function testMany<
  T extends { host: string; port: number; security?: string | null; sni?: string | null },
>(
  targets: T[],
  concurrency: number,
  _timeout: number,
  onOne?: (target: T, result: TestResult) => void | Promise<void>
): Promise<Map<T, TestResult>> {
  const results = new Map<T, TestResult>();
  let idx = 0;

  async function worker() {
    while (idx < targets.length) {
      const current = targets[idx++];
      const r = await probeConfig(current);
      results.set(current, r);
      if (onOne) await onOne(current, r);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
