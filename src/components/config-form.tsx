"use client";

import { motion } from "framer-motion";
import { Dices, QrCode, Save } from "lucide-react";
import { useMemo, useState } from "react";
import {
  PROTOCOL_LIST,
  PROTOCOL_META,
  SECURITY_META,
  SS_CIPHERS,
  TRANSPORT_META,
  VLESS_FLOWS,
} from "@/lib/constants";
import { buildShareLink, validateConfig } from "@/lib/share";
import type {
  ConfigInput,
  Protocol,
  Security,
  Transport,
} from "@/lib/types";
import { newUuid, randomToken } from "@/lib/utils";
import { useToast } from "./providers";
import QrModal from "./qr-modal";
import {
  Button,
  CopyButton,
  Field,
  MonoBox,
  Segmented,
  Select,
  TextInput,
} from "./primitives";

export const EMPTY_FORM: ConfigInput = {
  name: "",
  protocol: "vless",
  host: "",
  port: 443,
  uuid: newUuid(),
  password: "",
  flow: "",
  security: "tls",
  transport: "ws",
  sni: "",
  hostHeader: "",
  path: "/",
  serviceName: "",
  method: SS_CIPHERS[2],
  publicKey: "",
  privateKey: "",
  localAddress: "172.16.0.2/32,2606:4700:110:8a1c:2a6b:9f3d:2d6f:6bb/128",
  reserved: "",
  mtu: 1280,
  enabled: true,
  extras: {},
};

export default function ConfigForm({
  initial,
  editId,
  onSaved,
}: {
  initial?: Partial<ConfigInput>;
  editId?: number;
  onSaved?: () => void;
}) {
  const { push } = useToast();
  const [form, setForm] = useState<ConfigInput>({
    ...EMPTY_FORM,
    ...initial,
    extras: initial?.extras ?? {},
  });
  const [portStr, setPortStr] = useState(String(initial?.port ?? EMPTY_FORM.port));
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const set = <K extends keyof ConfigInput>(key: K, value: ConfigInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const protocol: Protocol = form.protocol;
  const hasTls = protocol !== "shadowsocks" && protocol !== "wireguard";
  const hasTransport = protocol !== "shadowsocks" && protocol !== "wireguard";
  const wsLike = form.transport === "ws" || form.transport === "httpupgrade";

  const share = useMemo(() => {
    try {
      return buildShareLink({
        ...form,
        port: Number(portStr) || 0,
        name: form.name || "config",
        host: form.host || "example.com",
        uuid: form.uuid || "00000000-0000-0000-0000-000000000000",
        privateKey: form.privateKey || "PRIVATE_KEY",
        publicKey: form.publicKey || "PUBLIC_KEY",
        password: form.password || "password",
      });
    } catch {
      return "";
    }
  }, [form, portStr]);

  const switchProtocol = (p: Protocol) => {
    setForm((f) => ({
      ...f,
      protocol: p,
      port: PROTOCOL_META[p].defaultPort,
      security: p === "shadowsocks" || p === "wireguard" ? "none" : "tls",
      transport:
        p === "shadowsocks" || p === "wireguard"
          ? "tcp"
          : f.transport === "tcp" || f.transport
            ? f.transport
            : "ws",
    }));
    setPortStr(String(PROTOCOL_META[p].defaultPort));
  };

  async function submit() {
    const payload: ConfigInput = {
      ...form,
      port: Number(portStr),
      mtu: form.mtu ? Number(form.mtu) : null,
    };
    const errors = validateConfig(payload);
    if (errors.length) {
      push(errors[0], "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(
        editId ? `/api/configs/${editId}` : "/api/configs",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطای سرور");
      push(editId ? "کانفیگ ویرایش شد" : "کانفیگ ساخته شد");
      onSaved?.();
    } catch (e) {
      push(e instanceof Error ? e.message : "خطا در ذخیره‌سازی", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* فرم */}
      <div className="glass rounded-3xl p-5 sm:p-6">
        {/* انتخاب پروتکل */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PROTOCOL_LIST.map((p) => {
            const meta = PROTOCOL_META[p];
            const active = protocol === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => switchProtocol(p)}
                className={`relative overflow-hidden rounded-2xl border p-3 text-center transition-all ${
                  active
                    ? "border-violet-400/40 bg-white/[0.06]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="protocol-glow"
                    className={`absolute inset-x-6 -top-6 h-10 rounded-full bg-gradient-to-b ${meta.glow} to-transparent blur-md`}
                  />
                )}
                <span className="relative block text-sm font-extrabold text-white">
                  {meta.label}
                </span>
                <span className="relative mt-1 line-clamp-2 block text-[10px] leading-4 text-slate-500">
                  {meta.desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="نام کانفیگ" className="sm:col-span-2">
            <TextInput
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثلاً: آلمان ۱ — WS + TLS"
            />
          </Field>

          <Field
            label="آدرس سرور"
            hint="دامنه یا IP تمیز (مثل IPهای کلادفلر برای کانفیگ‌های ورکر)"
            className="sm:col-span-2"
          >
            <TextInput
              dir="ltr"
              value={form.host}
              onChange={(e) => set("host", e.target.value)}
              placeholder="104.16.1.1 یا example.com"
              className="font-mono text-left"
            />
          </Field>

          <Field label="پورت">
            <TextInput
              dir="ltr"
              inputMode="numeric"
              value={portStr}
              onChange={(e) => setPortStr(e.target.value.replace(/[^0-9]/g, ""))}
              className="font-mono text-left"
            />
          </Field>

          {(protocol === "vless" || protocol === "vmess") && (
            <Field label="UUID">
              <div className="flex gap-2">
                <TextInput
                  dir="ltr"
                  value={form.uuid ?? ""}
                  onChange={(e) => set("uuid", e.target.value)}
                  className="font-mono text-left text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 px-3"
                  onClick={() => set("uuid", newUuid())}
                  title="UUID تصادفی جدید"
                >
                  <Dices className="size-4" />
                </Button>
              </div>
            </Field>
          )}

          {(protocol === "trojan" || protocol === "shadowsocks") && (
            <Field label="رمز عبور">
              <div className="flex gap-2">
                <TextInput
                  dir="ltr"
                  value={form.password ?? ""}
                  onChange={(e) => set("password", e.target.value)}
                  className="font-mono text-left text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 px-3"
                  onClick={() => set("password", randomToken(16))}
                  title="رمز تصادفی"
                >
                  <Dices className="size-4" />
                </Button>
              </div>
            </Field>
          )}

          {protocol === "shadowsocks" && (
            <Field label="روش رمزنگاری">
              <Select
                value={form.method ?? SS_CIPHERS[2]}
                onChange={(e) => set("method", e.target.value)}
              >
                {SS_CIPHERS.map((m) => (
                  <option key={m} value={m} dir="ltr">
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {protocol === "vless" && (
            <Field label="Flow" optional>
              <Select
                value={form.flow ?? ""}
                onChange={(e) => set("flow", e.target.value)}
              >
                {VLESS_FLOWS.map((f) => (
                  <option key={f} value={f} dir="ltr">
                    {f || "— بدون flow —"}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {hasTls && (
            <Field label="امنیت لایه انتقال">
              <Segmented<Security>
                value={form.security}
                onChange={(v) => set("security", v)}
                options={(Object.keys(SECURITY_META) as Security[])
                  .filter((s) => s !== "reality" || protocol === "vless")
                  .map((s) => ({ value: s, label: SECURITY_META[s].label }))}
              />
            </Field>
          )}

          {hasTransport && (
            <Field label="ترنسپورت">
              <Segmented<Transport>
                value={form.transport}
                onChange={(v) => set("transport", v)}
                options={(Object.keys(TRANSPORT_META) as Transport[]).map((t) => ({
                  value: t,
                  label: TRANSPORT_META[t].label,
                }))}
              />
            </Field>
          )}

          {hasTls && form.security !== "none" && (
            <Field label="SNI" hint="دامنه‌ای که در هندشیک TLS نمایش داده می‌شود">
              <TextInput
                dir="ltr"
                value={form.sni ?? ""}
                onChange={(e) => set("sni", e.target.value)}
                placeholder="speedtest.net"
                className="font-mono text-left text-xs"
              />
            </Field>
          )}

          {hasTransport && wsLike && (
            <>
              <Field label="Path">
                <TextInput
                  dir="ltr"
                  value={form.path ?? ""}
                  onChange={(e) => set("path", e.target.value)}
                  placeholder="/"
                  className="font-mono text-left text-xs"
                />
              </Field>
              <Field label="هدر Host" optional>
                <TextInput
                  dir="ltr"
                  value={form.hostHeader ?? ""}
                  onChange={(e) => set("hostHeader", e.target.value)}
                  placeholder="اختیاری"
                  className="font-mono text-left text-xs"
                />
              </Field>
            </>
          )}

          {hasTransport && form.transport === "grpc" && (
            <Field label="Service Name (gRPC)">
              <TextInput
                dir="ltr"
                value={form.serviceName ?? ""}
                onChange={(e) => set("serviceName", e.target.value)}
                className="font-mono text-left text-xs"
              />
            </Field>
          )}

          {form.security === "reality" && protocol === "vless" && (
            <>
              <Field label="Public Key (pbk)">
                <TextInput
                  dir="ltr"
                  value={form.publicKey ?? ""}
                  onChange={(e) => set("publicKey", e.target.value)}
                  className="font-mono text-left text-xs"
                />
              </Field>
              <Field label="Short ID (sid)" optional>
                <TextInput
                  dir="ltr"
                  value={form.extras?.shortId ?? ""}
                  onChange={(e) =>
                    set("extras", { ...form.extras, shortId: e.target.value })
                  }
                  className="font-mono text-left text-xs"
                />
              </Field>
            </>
          )}

          {protocol === "wireguard" && (
            <>
              <Field label="کلید خصوصی">
                <TextInput
                  dir="ltr"
                  value={form.privateKey ?? ""}
                  onChange={(e) => set("privateKey", e.target.value)}
                  className="font-mono text-left text-xs"
                />
              </Field>
              <Field label="کلید عمومی سرور">
                <TextInput
                  dir="ltr"
                  value={form.publicKey ?? ""}
                  onChange={(e) => set("publicKey", e.target.value)}
                  className="font-mono text-left text-xs"
                />
              </Field>
              <Field label="آدرس داخلی" hint="با کاما جدا کنید">
                <TextInput
                  dir="ltr"
                  value={form.localAddress ?? ""}
                  onChange={(e) => set("localAddress", e.target.value)}
                  className="font-mono text-left text-xs"
                />
              </Field>
              <Field label="Reserved / MTU" optional>
                <div className="flex gap-2">
                  <TextInput
                    dir="ltr"
                    value={form.reserved ?? ""}
                    onChange={(e) => set("reserved", e.target.value)}
                    placeholder="1,2,3"
                    className="font-mono text-left text-xs"
                  />
                  <TextInput
                    dir="ltr"
                    inputMode="numeric"
                    value={form.mtu ?? ""}
                    onChange={(e) =>
                      set("mtu", Number(e.target.value.replace(/[^0-9]/g, "")) || null)
                    }
                    placeholder="1280"
                    className="w-24 font-mono text-left text-xs"
                  />
                </div>
              </Field>
            </>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
          <Button onClick={submit} disabled={saving}>
            <Save className="size-4" />
            {saving ? "در حال ذخیره…" : editId ? "ذخیره تغییرات" : "ساخت کانفیگ"}
          </Button>
          {!editId && (
            <p className="text-[11px] text-slate-500">
              پس از ساخت، کانفیگ در فهرست و در اشتراک‌ها قرار می‌گیرد
            </p>
          )}
        </div>
      </div>

      {/* پیش‌نمایش زنده */}
      <div className="glass h-fit rounded-3xl p-5 lg:sticky lg:top-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white">پیش‌نمایش زنده لینک</h3>
          <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" />
        </div>
        <MonoBox text={share} className="max-h-40 min-h-20 whitespace-normal break-all" />
        <div className="mt-4 flex gap-2">
          <CopyButton text={share} label="کپی" className="flex-1 py-2.5" />
          <Button variant="ghost" className="flex-1" onClick={() => setQrOpen(true)}>
            <QrCode className="size-4" />
            نمایش QR
          </Button>
        </div>
        <div className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-4 text-[11px] leading-relaxed text-slate-500">
          <p>· این لینک دقیقاً همان چیزی است که در اشتراک قرار می‌گیرد.</p>
          <p>· برای کانفیگ‌های ورکر، آدرس سرور را IP تمیز کلادفلر بگذارید.</p>
          <p>· با «ساخت انبوه» از همین قالب صدها کانفیگ یکجا بسازید.</p>
        </div>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        text={share}
        title={form.name || "کانفیگ"}
      />
    </div>
  );
}
