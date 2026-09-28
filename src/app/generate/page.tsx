"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Cpu,
  Dices,
  KeyRound,
  Loader2,
  Server,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader, ProtocolBadge, CopyButton, QrButton, StatusPill } from "@/components/shared";
import { cn, faNum, newUuid as newUuidClient } from "@/lib/utils";
import { PROTOCOL_META, SECURITY_META, SS_CIPHERS, TRANSPORT_META, VLESS_FLOWS } from "@/lib/constants";
import type { ConfigInput, ConfigWithShare, Protocol, Security, Transport } from "@/lib/types";

type Tab = "auto" | "manual";

export default function GeneratePage() {
  const [tab, setTab] = useState<Tab>("auto");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="ساخت کانفیگ"
        desc="حالت خودکار: یک سرور واقعی تست‌شده از مخزن زنده. حالت دستی: کانفیگ با مشخصات سرور خودتان بسازید."
      />

      <div className="mb-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1.5">
        <TabBtn active={tab === "auto"} onClick={() => setTab("auto")} icon={<Sparkles className="size-4" />} label="خودکار (واقعی)" />
        <TabBtn active={tab === "manual"} onClick={() => setTab("manual")} icon={<Wand2 className="size-4" />} label="ساخت دستی" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "auto" ? <AutoPanel /> : <ManualPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
        active ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- حالت خودکار: کانفیگ واقعی از مخزن ---------------- */
function AutoPanel() {
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<ConfigWithShare | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/single", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ساخت");
      setItem(data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ساخت کانفیگ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="glass relative overflow-hidden rounded-3xl p-8 text-center">
        <div className="absolute -top-24 right-1/2 size-64 translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <Dices className="mx-auto mb-4 size-10 text-cyan-300 animate-float" />
        <h2 className="text-lg font-extrabold text-white">کانفیگ واقعی و تست‌شده</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-7 text-zinc-400">
          برخلاف نسخه قبلی که UUID تصادفی روی IP‌های تصادفی می‌ساخت (و هیچ‌وقت وصل نمی‌شد)، این دکمه یک
          سرور واقعی از مخزن انتخاب می‌کند که اتصال TCP آن همین الان تست شده است.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className={cn(
            "mt-6 inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-gradient-to-l from-cyan-400 to-violet-500 px-8 py-3.5 text-[15px] font-black text-zinc-950 shadow-[0_0_36px_rgba(34,211,238,0.4)] transition",
            busy ? "cursor-wait opacity-70" : "hover:brightness-110 active:scale-[0.98]"
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Zap className="size-5" strokeWidth={2.5} />}
          {busy ? "در حال انتخاب و تست…" : item ? "یکی دیگر بساز" : "ساخت کانفیگ"}
        </button>
        {error && (
          <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl bg-rose-400/10 px-4 py-2.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/25">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <AnimatePresence>
        {item && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <ResultCard item={item} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- نمایش نتیجه ---------------- */
function ResultCard({ item }: { item: ConfigWithShare }) {
  const chips: [string, string | number | null | undefined][] = [
    ["سرور", item.host],
    ["پورت", item.port],
    ["امنیت", SECURITY_META[item.security]?.label ?? item.security],
    ["شبکه", TRANSPORT_META[item.transport]?.label ?? item.transport],
    ["SNI", item.sni],
    ["منبع", item.source],
  ];
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/30">
            <ShieldCheck className="size-5 text-emerald-300" />
          </span>
          <div>
            <p className="text-[15px] font-extrabold text-white">{item.name}</p>
            <p className="num mt-0.5 text-[11px] text-zinc-500" dir="ltr">
              {item.host}:{item.port}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProtocolBadge protocol={item.protocol} />
          <StatusPill alive={item.alive} latency={item.latency} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-black/40 p-4" dir="ltr">
        <code className="block break-all text-left text-[11px] leading-5 text-cyan-200/90">{item.share}</code>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {chips
          .filter(([, v]) => v !== null && v !== undefined && v !== "")
          .map(([k, v]) => (
            <span key={k} className="rounded-lg bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-zinc-400 ring-1 ring-white/[0.07]">
              {k}: <span className="num font-bold text-zinc-200" dir="auto">{String(v)}</span>
            </span>
          ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <CopyButton text={item.share} label="کپی لینک کانفیگ" className="flex-1 sm:flex-none" />
        <QrButton text={item.share} title={item.name} />
      </div>
    </div>
  );
}

/* ---------------- حالت دستی ---------------- */
interface FormState {
  protocol: Protocol;
  name: string;
  host: string;
  port: string;
  uuid: string;
  password: string;
  flow: string;
  security: Security;
  transport: Transport;
  sni: string;
  hostHeader: string;
  path: string;
  serviceName: string;
  method: string;
  publicKey: string;
  privateKey: string;
}

const INIT: FormState = {
  protocol: "vless",
  name: "",
  host: "",
  port: "443",
  uuid: "",
  password: "",
  flow: "",
  security: "tls",
  transport: "ws",
  sni: "",
  hostHeader: "",
  path: "/",
  serviceName: "",
  method: SS_CIPHERS[0],
  publicKey: "",
  privateKey: "",
};

function ManualPanel() {
  const [f, setF] = useState<FormState>(INIT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<ConfigWithShare | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const needsUuid = f.protocol === "vless" || f.protocol === "vmess";
  const needsPass = f.protocol === "trojan" || f.protocol === "shadowsocks";
  const isWg = f.protocol === "wireguard";
  const isSs = f.protocol === "shadowsocks";
  const showWs = f.transport === "ws" || f.transport === "httpupgrade";
  const passThrough = f.protocol === "hysteria2" || f.protocol === "tuic" || f.protocol === "ssr";

  const submit = async () => {
    setBusy(true);
    setError("");
    setDone(null);
    const payload: ConfigInput = {
      protocol: f.protocol,
      name: f.name.trim() || `${f.host}:${f.port}`,
      host: f.host.trim(),
      port: Number(f.port) || 443,
      security: isWg || isSs ? "none" : f.security,
      transport: isWg ? "udp" : isSs ? "tcp" : f.transport,
      uuid: needsUuid ? f.uuid.trim() : null,
      password: needsPass || passThrough ? f.password : null,
      flow: f.protocol === "vless" && f.flow ? f.flow : null,
      sni: !isWg && f.sni.trim() ? f.sni.trim() : null,
      hostHeader: showWs && f.hostHeader.trim() ? f.hostHeader.trim() : null,
      path: showWs ? f.path || "/" : null,
      serviceName: f.transport === "grpc" ? f.serviceName.trim() : null,
      method: isSs ? f.method : null,
      publicKey: isWg || f.security === "reality" ? f.publicKey.trim() : null,
      privateKey: isWg ? f.privateKey.trim() : null,
      enabled: true,
      extras: {},
    };

    try {
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ساخت");
      setDone(data.item);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  };

  const protoList = useMemo(
    () => (Object.keys(PROTOCOL_META) as Protocol[]).filter((p) => !["hysteria2", "tuic", "ssr", "other"].includes(p)),
    []
  );

  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      {/* انتخاب پروتکل */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {protoList.map((p) => {
          const meta = PROTOCOL_META[p];
          const active = f.protocol === p;
          return (
            <button
              key={p}
              onClick={() => set("protocol", p)}
              className={cn(
                "cursor-pointer rounded-2xl border p-3.5 text-center transition-all",
                active ? "border-cyan-400/50 bg-cyan-400/[0.08] shadow-[0_0_24px_rgba(34,211,238,0.15)]" : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
              )}
            >
              <span className={cn("text-sm font-extrabold", active ? "text-cyan-300" : "text-zinc-300")}>{meta.label}</span>
              <span className="mt-1 block text-[10px] leading-4 text-zinc-500">{meta.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="نام کانفیگ" icon={<Server className="size-4" />}>
          <input className="field" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="مثلاً سرور آلمان ۱" />
        </Field>
        <Field label="آدرس سرور (دامنه یا IP) *" icon={<Cpu className="size-4" />}>
          <input dir="ltr" className="field text-left" value={f.host} onChange={(e) => set("host", e.target.value)} placeholder="example.com" />
        </Field>
        <Field label="پورت *">
          <input dir="ltr" type="number" className="field text-left" value={f.port} onChange={(e) => set("port", e.target.value)} placeholder={String(PROTOCOL_META[f.protocol].defaultPort)} />
        </Field>

        {needsUuid && (
          <Field label="UUID *" icon={<KeyRound className="size-4" />}>
            <div className="flex gap-2">
              <input dir="ltr" className="field text-left" value={f.uuid} onChange={(e) => set("uuid", e.target.value)} placeholder="xxxxxxxx-xxxx-..." />
              <button onClick={() => set("uuid", newUuidClient())} className="shrink-0 cursor-pointer rounded-xl bg-white/[0.06] px-3 text-xs font-bold text-cyan-300 ring-1 ring-white/10 transition hover:bg-white/10">
                تولید
              </button>
            </div>
          </Field>
        )}

        {needsPass && (
          <Field label="رمز عبور *">
            <input dir="ltr" className="field text-left" value={f.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" />
          </Field>
        )}

        {isSs && (
          <Field label="روش رمزنگاری">
            <select className="field" value={f.method} onChange={(e) => set("method", e.target.value)}>
              {SS_CIPHERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        )}

        {isWg && (
          <>
            <Field label="کلید خصوصی *">
              <input dir="ltr" className="field text-left" value={f.privateKey} onChange={(e) => set("privateKey", e.target.value)} />
            </Field>
            <Field label="کلید عمومی *">
              <input dir="ltr" className="field text-left" value={f.publicKey} onChange={(e) => set("publicKey", e.target.value)} />
            </Field>
          </>
        )}

        {!isWg && !isSs && (
          <>
            <Field label="امنیت">
              <select className="field" value={f.security} onChange={(e) => set("security", e.target.value as Security)}>
                {Object.entries(SECURITY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </Field>
            <Field label="شبکه (Transport)">
              <select className="field" value={f.transport} onChange={(e) => set("transport", e.target.value as Transport)}>
                {Object.entries(TRANSPORT_META)
                  .filter(([k]) => k !== "udp")
                  .map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
              </select>
            </Field>
            <Field label="SNI">
              <input dir="ltr" className="field text-left" value={f.sni} onChange={(e) => set("sni", e.target.value)} placeholder="www.speedtest.net" />
            </Field>
            {f.protocol === "vless" && (
              <Field label="Flow">
                <select className="field" value={f.flow} onChange={(e) => set("flow", e.target.value)}>
                  {VLESS_FLOWS.map((fl) => (
                    <option key={fl} value={fl}>{fl || "هیچ‌کدام"}</option>
                  ))}
                </select>
              </Field>
            )}
            {f.security === "reality" && (
              <Field label="کلید عمومی Reality (pbk) *">
                <input dir="ltr" className="field text-left" value={f.publicKey} onChange={(e) => set("publicKey", e.target.value)} />
              </Field>
            )}
            {showWs && (
              <>
                <Field label="Path">
                  <input dir="ltr" className="field text-left" value={f.path} onChange={(e) => set("path", e.target.value)} placeholder="/ws" />
                </Field>
                <Field label="Host Header">
                  <input dir="ltr" className="field text-left" value={f.hostHeader} onChange={(e) => set("hostHeader", e.target.value)} placeholder="اختیاری" />
                </Field>
              </>
            )}
            {f.transport === "grpc" && (
              <Field label="Service Name">
                <input dir="ltr" className="field text-left" value={f.serviceName} onChange={(e) => set("serviceName", e.target.value)} placeholder="grpc-service" />
              </Field>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-rose-400/10 px-4 py-2.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/25">
          <XCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy}
        className={cn(
          "mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-400 to-violet-500 px-6 py-3.5 text-sm font-black text-zinc-950 transition",
          busy ? "cursor-wait opacity-70" : "hover:brightness-110 active:scale-[0.99]"
        )}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" strokeWidth={2.5} />}
        {busy ? "در حال ذخیره…" : "ساخت و ذخیره کانفیگ"}
      </button>

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
            <ResultCard item={done} />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-center text-[11px] leading-5 text-zinc-500">
        نکته مهم: حالت دستی فقط قالب لینک را از مشخصات سرور شما می‌سازد؛ کارکرد آن به سرور واقعی شما بستگی دارد.
        {done && ` این کانفیگ با شناسه ${faNum(done.id)} در مخزن ذخیره شد.`}
      </p>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
