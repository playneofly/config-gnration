import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Db = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): D1Db {
  const { env } = getCloudflareContext();
  return drizzle((env as { DB: D1Database }).DB, { schema });
}

// Existing API routes use `db.select()`, `db.insert()`, etc. The proxy keeps
// those routes unchanged while resolving the Cloudflare D1 binding per request.
export const db = new Proxy({} as D1Db, {
  get(_target, property) {
    return (getDb() as unknown as Record<PropertyKey, unknown>)[property];
  },
});
