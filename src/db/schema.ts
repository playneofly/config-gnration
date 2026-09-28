import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const configs = pgTable(
  "configs",
  {
    id: serial("id").primaryKey(),
    fingerprint: text("fingerprint").notNull(),
    name: text("name").notNull(),
    protocol: text("protocol").notNull(),
    host: text("host").notNull(),
    port: integer("port").notNull(),
    uuid: text("uuid"),
    password: text("password"),
    flow: text("flow"),
    security: text("security").notNull().default("tls"),
    transport: text("transport").notNull().default("ws"),
    sni: text("sni"),
    hostHeader: text("host_header"),
    path: text("path").default("/"),
    serviceName: text("service_name"),
    method: text("method"),
    publicKey: text("public_key"),
    privateKey: text("private_key"),
    localAddress: text("local_address"),
    reserved: text("reserved"),
    mtu: integer("mtu"),
    enabled: boolean("enabled").notNull().default(true),
    alive: boolean("alive"), // null = untested
    latency: integer("latency"), // ms
    lastTestedAt: timestamp("last_tested_at", { withTimezone: true }),
    source: text("source").notNull().default("manual"),
    rawLink: text("raw_link"), // original link for pass-through protocols
    extras: jsonb("extras").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("configs_fingerprint_idx").on(t.fingerprint),
    index("configs_protocol_idx").on(t.protocol),
    index("configs_enabled_idx").on(t.enabled),
    index("configs_alive_idx").on(t.alive),
  ]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    token: text("token").notNull(),
    onlyAlive: boolean("only_alive").notNull().default(true),
    maxConfigs: integer("max_configs").notNull().default(200),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscriptions_token_idx").on(t.token)]
);

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  fetchedLines: integer("fetched_lines").notNull().default(0),
  parsed: integer("parsed").notNull().default(0),
  inserted: integer("inserted").notNull().default(0),
  duplicates: integer("duplicates").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  tested: integer("tested").notNull().default(0),
  aliveCount: integer("alive_count").notNull().default(0),
  sourcesOk: integer("sources_ok").notNull().default(0),
  sourcesTotal: integer("sources_total").notNull().default(0),
  detail: jsonb("detail").$type<{ name: string; lines: number; ok: boolean }[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ConfigSelect = typeof configs.$inferSelect;
export type SubscriptionSelect = typeof subscriptions.$inferSelect;
export type SyncRunSelect = typeof syncRuns.$inferSelect;
