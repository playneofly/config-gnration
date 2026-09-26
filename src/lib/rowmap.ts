import type { configs } from "@/db/schema";
import type { ConfigInput } from "./types";

/** تبدیل ردیف دیتابیس به ورودی ساخت لینک */
export function rowToConfigInput(row: typeof configs.$inferSelect): ConfigInput {
  return {
    name: row.name,
    protocol: row.protocol as ConfigInput["protocol"],
    host: row.host,
    port: row.port,
    uuid: row.uuid,
    password: row.password,
    flow: row.flow,
    security: row.security as ConfigInput["security"],
    transport: row.transport as ConfigInput["transport"],
    sni: row.sni,
    hostHeader: row.hostHeader,
    path: row.path,
    serviceName: row.serviceName,
    method: row.method,
    publicKey: row.publicKey,
    privateKey: row.privateKey,
    localAddress: row.localAddress,
    reserved: row.reserved,
    mtu: row.mtu,
    enabled: row.enabled,
    extras: row.extras ?? {},
  };
}
