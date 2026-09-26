import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const configs = pgTable(
  "configs",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    protocol: varchar("protocol", { length: 24 }).notNull(),
    host: varchar("host", { length: 255 }).notNull(),
    port: integer("port").notNull(),
    uuid: varchar("uuid", { length: 64 }),
    password: varchar("password", { length: 255 }),
    flow: varchar("flow", { length: 40 }),
    security: varchar("security", { length: 24 }).notNull().default("tls"),
    transport: varchar("transport", { length: 24 }).notNull().default("ws"),
    sni: varchar("sni", { length: 255 }),
    hostHeader: varchar("host_header", { length: 255 }),
    path: varchar("path", { length: 255 }).default("/"),
    serviceName: varchar("service_name", { length: 255 }),
    method: varchar("method", { length: 40 }),
    publicKey: varchar("public_key", { length: 128 }),
    privateKey: varchar("private_key", { length: 128 }),
    localAddress: varchar("local_address", { length: 96 }),
    reserved: varchar("reserved", { length: 32 }),
    mtu: integer("mtu"),
    enabled: boolean("enabled").notNull().default(true),
    extras: jsonb("extras").$type<Record<string, string>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("configs_protocol_idx").on(t.protocol),
    index("configs_enabled_idx").on(t.enabled),
  ]
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    token: varchar("token", { length: 64 }).notNull(),
    mode: varchar("mode", { length: 12 }).notNull().default("all"),
    configIds: jsonb("config_ids").$type<number[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("subscriptions_token_idx").on(t.token)]
);

export type ConfigSelect = typeof configs.$inferSelect;
export type SubscriptionSelect = typeof subscriptions.$inferSelect;
