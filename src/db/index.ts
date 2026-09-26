import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Keep database construction lazy enough for Next.js build analysis.
// DATABASE_URL must still be configured in the hosting provider at runtime.
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    // pg does not open a connection until a query is executed. This fallback
    // prevents `next build` from crashing while still failing clearly at runtime
    // if the required environment variable was not configured.
    connectionString: databaseUrl || "postgresql://localhost:5432/configs",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
