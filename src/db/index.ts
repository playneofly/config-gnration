import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ensureSchema } from "@/lib/migrate";

/**
 * اتصال تنبل (lazy): نه در build اتصالی برقرار می‌شود نه env خوانده می‌شود؛
 * DATABASE_URL هنگام اولین کوئریِ واقعی خوانده می‌شود — مهم برای Cloudflare
 * Workers که env فقط در زمان اجرای request معتبر است.
 *
 * max: 3 → وورکرهای کلادفلر در هر اجرا حداکثر ۶ اتصال TCP همزمان دارند؛
 * پول بزرگ‌تر باعث رقابت با سوکت‌های تست اتصال و خطاهای تصادفی می‌شود.
 */
const globalForDb = globalThis as typeof globalThis & {
  __configGenPool?: Pool;
};

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL تنظیم نشده است — یک دیتابیس PostgreSQL بسازید (مثلاً Neon رایگان) و در داشبورد کلادفلر: Worker → Settings → Variables and Secrets یک Secret با نام DATABASE_URL اضافه کنید، سپس Redeploy نمایید."
    );
  }
  if (!globalForDb.__configGenPool) {
    const inner = new Pool({
      connectionString: databaseUrl,
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 10000,
      keepAlive: true,
    });
    // قبل از اولین کوئری، جدول‌ها به‌صورت خودکار ساخته/ارتقا می‌یابند (idempotent)
    globalForDb.__configGenPool = new Proxy(inner, {
      get(target, prop, receiver) {
        if (prop === "query" || prop === "connect") {
          return async (...args: unknown[]) => {
            await ensureSchema(inner);
            const fn = Reflect.get(target, prop, receiver) as (...a: unknown[]) => unknown;
            return fn.apply(target, args);
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as Pool;
  }
  return globalForDb.__configGenPool;
}

class LazyPool {
  private real: Pool | null = null;
  private get pool(): Pool {
    if (!this.real) this.real = createPool();
    return this.real;
  }
  query(...args: Parameters<Pool["query"]>) {
    return (this.pool.query as (...a: typeof args) => ReturnType<Pool["query"]>)(...args);
  }
  connect(...args: Parameters<Pool["connect"]>) {
    return this.pool.connect(...args);
  }
  end(...args: Parameters<Pool["end"]>) {
    return this.real ? this.pool.end(...args) : Promise.resolve();
  }
  on(...args: Parameters<Pool["on"]>) {
    this.pool.on(...args);
    return this;
  }
}

export const pool = new LazyPool() as unknown as Pool;

export const db = drizzle(pool);
