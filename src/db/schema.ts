import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const configs = sqliteTable(
  "configs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
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
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    extras: text("extras", { mode: "json" }).$type<Record<string, string>>().default({}),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (t) => [index("configs_protocol_idx").on(t.protocol), index("configs_enabled_idx").on(t.enabled)]
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    token: text("token").notNull(),
    mode: text("mode").notNull().default("all"),
    configIds: text("config_ids", { mode: "json" }).$type<number[]>().default([]),
    createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  },
  (t) => [uniqueIndex("subscriptions_token_idx").on(t.token)]
);

export type ConfigSelect = typeof configs.$inferSelect;
export type SubscriptionSelect = typeof subscriptions.$inferSelect;
