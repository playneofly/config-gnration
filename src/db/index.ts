import type { D1Database } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type D1Db = ReturnType<typeof drizzle<typeof schema>>;

export function getDb(): D1Db {
  const { env } = getCloudflareContext();
  return drizzle((env as { DB: D1Database }).DB, { schema });
}

// Resolve and bind each Drizzle method to the D1 client for the current request.
// This keeps the existing API route code (db.select(), db.insert(), etc.) working.
export const db = new Proxy({} as D1Db, {
  get(_target, property) {
    const database = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = database[property];
    return typeof value === "function" ? value.bind(database) : value;
  },
});
