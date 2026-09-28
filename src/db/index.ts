import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ensureSchema } from "@/lib/migrate";

const databaseUrl = process.env.DATABASE_URL;

/**
 * اتصال تنبل (lazy): در زمان build یا import ماژول، اتصالی برقرار نمی‌شود
 * و خطا هم پرتاب نمی‌شود؛ فقط هنگام اولین کوئری واقعی Pool ساخته می‌شود.
 * این یعنی deploy روی Cloudflare/Vercel بدون تنظیم env در مرحله build هم
 * با موفقیت build می‌شود و فقط در runtime به DATABASE_URL نیاز دارد.
 */
const globalForDb = globalThis as typeof globalThis & {
  __configGenPool?: Pool;
};

function createPool(): Pool {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL تنظیم نشده است — یک دیتابیس PostgreSQL بسازید (مثلاً Neon رایگان) و متغیر DATABASE_URL را در تنظیمات هاست قرار دهید."
    );
  }
  if (!globalForDb.__configGenPool) {
    const inner = new Pool({ connectionString: databaseUrl });
    // قبل از اولین کوئری، جدول‌ها به‌صورت خودکار ساخته می‌شوند (idempotent)
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
