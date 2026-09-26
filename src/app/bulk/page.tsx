"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Download,
  ListChecks,
  Loader2,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useToast } from "@/components/providers";
import {
  Button,
  copyText,
  Field,
  MonoBox,
  PageHeader,
  Segmented,
  Select,
  TextArea,
  TextInput,
} from "@/components/primitives";
import {
  CLEAN_HOSTS_PRESET,
  POPULAR_PORTS,
  PROTOCOL_LIST,
  PROTOCOL_META,
  SECURITY_META,
  SS_CIPHERS,
  TRANSPORT_META,
} from "@/lib/constants";
import type { Protocol, Security, Transport } from "@/lib/types";
import { cn } from "@/lib/utils";

type HostMode = "fixed" | "rotate";
type PortMode = "fixed" | "range" | "pool";
type ProtocolChoice = Protocol | "mixed";
type AutoMode = "auto" | "manual";

const MAX_TOTAL = 1_000_000;
const CHUNK = 25_000;
const QUICK_COUNTS = [100, 1_000, 10_000, 100_000, 1_000_000];

interface BulkResult {
  created: number;
  shares: string[];
}

const faNum = (n: number) => n.toLocaleString("fa-IR");

export default function BulkPage() {
  const { push } = useToast();
  const [prefix, setPrefix] = useState("NEON");
  const [countStr, setCountStr] = useState("100");
  const [protocol, setProtocol] = useState<ProtocolChoice>("vless");
  const [hostMode, setHostMode] = useState<HostMode>("rotate");
  const [fixedHost, setFixedHost] = useState("");
  const [hostsText, setHostsText] = useState(CLEAN_HOSTS_PRESET.join("\n"));
  const [portMode, setPortMode] = useState<PortMode>("fixed");
  const [port, setPort] = useState("443");
  const [portMin, setPortMin] = useState("1024");
  const [portMax, setPortMax] = useState("65000");
  const [portPool, setPortPool] = useState<number[]>([443, 8443, 2096, 2087]);
  const [security, setSecurity] = useState<Security>("tls");
  const [transport, setTransport] = useState<Transport>("ws");
  const [sniMode, setSniMode] = useState<AutoMode>("auto");
  const [pathMode, setPathMode] = useState<AutoMode>("auto");
  const [sni, setSni] = useState("");
  const [path, setPath] = useState("/");
  const [hostHeader, setHostHeader] = useState("");
  const [method, setMethod] = useState(SS_CIPHERS[2]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<BulkResult | null>(null);
  const abortRef = useRef(false);

  const count = Math.min(
    MAX_TOTAL,
    Math.max(1, Number(countStr.replace(/[^0-9]/g, "")) || 1)
  );
  const hasTls =
    protocol !== "shadowsocks" && protocol !== "wireguard" && protocol !== "mixed";
  const hosts = hostsText.split(/\r?\n/).map((h) => h.trim()).filter(Boolean);

  function togglePoolPort(p: number) {
    setPortPool((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function generate() {
    if (!prefix.trim()) return push("پیشوند نام الزامی است", "error");
    if (hostMode === "fixed" && !fixedHost.trim())
      return push("آدرس سرور را وارد کنید", "error");
    if (hostMode === "rotate" && !hosts.length)
      return push("حداقل یک سرور در فهرست چرخش وارد کنید", "error");

    setBusy(true);
    setResult(null);
    abortRef.current = false;
    setProgress({ done: 0, total: count });

    const allShares: string[] = [];
    let created = 0;

    try {
      let remaining = count;
      let startIndex = 0;
      while (remaining > 0) {
        if (abortRef.current) throw new Error("عملیات توسط شما متوقف شد");
        const n = Math.min(CHUNK, remaining);
        const res = await fetch("/api/configs/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prefix: prefix.trim(),
            count: n,
            startIndex,
            totalPlanned: count,
            protocol,
            hostMode,
            hosts: hostMode === "fixed" ? [fixedHost.trim()] : hosts,
            portMode,
            port: Number(port) || 443,
            portMin: Number(portMin) || 1,
            portMax: Number(portMax) || 65535,
            portPool,
            security:
              protocol === "shadowsocks" || protocol === "wireguard"
                ? "none"
                : security,
            transport,
            sni: sniMode === "auto" ? "@auto" : sni || undefined,
            hostHeader: hostHeader || undefined,
            path: pathMode === "auto" ? "@auto" : path || "/",
            method: protocol === "shadowsocks" ? method : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطای سرور");
        created += data.created;
        if (Array.isArray(data.shares)) allShares.push(...data.shares);
        setProgress({ done: created, total: count });
        remaining -= n;
        startIndex += n;
      }
      setResult({ created, shares: allShares });
      push(`${faNum(created)} کانفیگ با موفقیت ساخته شد`);
    } catch (e) {
      push(e instanceof Error ? e.message : "خطا در ساخت انبوه", "error");
      if (created > 0) setResult({ created, shares: allShares });
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  const pct =
    progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="ساخت انبوه کانفیگ"
        desc="تا ۱,۰۰۰,۰۰۰ کانفیگ در هر بار — همه‌چیز خودکار: UUID و رمز تصادفی، چرخش سرورها، SNI و Path تصادفی. بدون هیچ تنظیمی، دکمه را بزنید."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* الگو */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold text-white">
            <Wand2 className="size-4 text-violet-300" />
            الگوی تولید
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="پیشوند نام">
              <TextInput
                dir="ltr"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="text-left font-mono"
              />
            </Field>
            <Field label="پروتکل">
              <Select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value as ProtocolChoice)}
              >
                <option value="mixed">مخلوط (چرخشی بین همه)</option>
                {PROTOCOL_LIST.map((p) => (
                  <option key={p} value={p}>
                    {PROTOCOL_META[p].label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* تعداد */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>تعداد کانفیگ</span>
              <TextInput
                dir="ltr"
                inputMode="numeric"
                value={countStr}
                onChange={(e) => setCountStr(e.target.value)}
                onBlur={() => setCountStr(String(count))}
                className="w-32 py-1.5 text-center font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {QUICK_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCountStr(String(n))}
                  className={cn(
                    "rounded-xl px-1 py-2 text-[11px] font-extrabold transition-all",
                    count === n
                      ? "bg-gradient-to-l from-violet-500 to-indigo-500 text-white shadow-lg"
                      : "bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:text-white"
                  )}
                >
                  {faNum(n)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              حجم‌های بالای {faNum(CHUNK)} به‌صورت خودکار به چند دسته تقسیم و با
              نوار پیشرفت ساخته می‌شوند — سقف: {faNum(MAX_TOTAL)} کانفیگ.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {hasTls && (
              <Field label="امنیت">
                <Segmented<Security>
                  value={security}
                  onChange={setSecurity}
                  options={(["tls", "none"] as Security[]).map((s) => ({
                    value: s,
                    label: SECURITY_META[s].label,
                  }))}
                />
              </Field>
            )}
            {protocol !== "shadowsocks" && protocol !== "wireguard" && (
              <Field label="ترنسپورت">
                <Segmented<Transport>
                  value={transport}
                  onChange={setTransport}
                  options={(["ws", "tcp", "grpc", "httpupgrade"] as Transport[]).map(
                    (t) => ({ value: t, label: TRANSPORT_META[t].label })
                  )}
                />
              </Field>
            )}
            {protocol === "shadowsocks" && (
              <Field label="رمزنگاری" className="sm:col-span-2">
                <Select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {SS_CIPHERS.map((m) => (
                    <option key={m} dir="ltr">
                      {m}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {protocol !== "wireguard" && (
              <>
                <Field label="SNI">
                  <Segmented<AutoMode>
                    value={sniMode}
                    onChange={setSniMode}
                    options={[
                      { value: "auto", label: "خودکار (تصادفی)" },
                      { value: "manual", label: "دستی" },
                    ]}
                  />
                  {sniMode === "manual" && (
                    <TextInput
                      dir="ltr"
                      value={sni}
                      onChange={(e) => setSni(e.target.value)}
                      placeholder="speedtest.net"
                      className="mt-2 text-left font-mono text-xs"
                    />
                  )}
                </Field>
                <Field label="Path">
                  <Segmented<AutoMode>
                    value={pathMode}
                    onChange={setPathMode}
                    options={[
                      { value: "auto", label: "خودکار (تصادفی)" },
                      { value: "manual", label: "دستی" },
                    ]}
                  />
                  {pathMode === "manual" && (
                    <TextInput
                      dir="ltr"
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      className="mt-2 text-left font-mono text-xs"
                    />
                  )}
                </Field>
                {(transport === "ws" || transport === "httpupgrade") &&
                  pathMode === "manual" && (
                    <Field label="هدر Host" optional>
                      <TextInput
                        dir="ltr"
                        value={hostHeader}
                        onChange={(e) => setHostHeader(e.target.value)}
                        className="text-left font-mono text-xs"
                      />
                    </Field>
                  )}
              </>
            )}
          </div>
        </div>

        {/* سرورها و پورت‌ها */}
        <div className="glass rounded-3xl p-5 sm:p-6">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-extrabold text-white">
            <ListChecks className="size-4 text-cyan-300" />
            سرورها و پورت‌ها
          </h3>

          <Field label="حالت سرور">
            <Segmented<HostMode>
              value={hostMode}
              onChange={setHostMode}
              options={[
                { value: "rotate", label: "چرخش بین IP تمیز (پیش‌فرض)" },
                { value: "fixed", label: "سرور ثابت" },
              ]}
            />
          </Field>

          {hostMode === "fixed" ? (
            <Field label="آدرس سرور" className="mt-4">
              <TextInput
                dir="ltr"
                value={fixedHost}
                onChange={(e) => setFixedHost(e.target.value)}
                placeholder="104.16.1.1"
                className="text-left font-mono"
              />
            </Field>
          ) : (
            <div className="mt-4">
              <Field
                label={`فهرست سرورها (${faNum(hosts.length)} مورد)`}
                hint="در هر خط یک IP یا دامنه — کانفیگ‌ها به‌نوبت بین آن‌ها پخش می‌شوند"
              >
                <TextArea
                  dir="ltr"
                  rows={7}
                  value={hostsText}
                  onChange={(e) => setHostsText(e.target.value)}
                  className="text-left font-mono text-xs leading-6"
                />
              </Field>
              <Button
                variant="ghost"
                className="mt-2 w-full py-2 text-xs"
                onClick={() => setHostsText(CLEAN_HOSTS_PRESET.join("\n"))}
              >
                <Zap className="size-3.5" />
                بازنشانی با IPهای پرکاربرد کلادفلر
              </Button>
            </div>
          )}

          <div className="mt-5 border-t border-white/[0.07] pt-5">
            <Field label="حالت پورت">
              <Segmented<PortMode>
                value={portMode}
                onChange={setPortMode}
                options={[
                  { value: "fixed", label: "ثابت" },
                  { value: "range", label: "بازه تصادفی" },
                  { value: "pool", label: "استخر TLS" },
                ]}
              />
            </Field>
            {portMode === "fixed" && (
              <Field label="پورت" className="mt-4">
                <TextInput
                  dir="ltr"
                  inputMode="numeric"
                  value={port}
                  onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
                  className="text-left font-mono"
                />
              </Field>
            )}
            {portMode === "range" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label="از پورت">
                  <TextInput
                    dir="ltr"
                    inputMode="numeric"
                    value={portMin}
                    onChange={(e) => setPortMin(e.target.value.replace(/[^0-9]/g, ""))}
                    className="text-left font-mono"
                  />
                </Field>
                <Field label="تا پورت">
                  <TextInput
                    dir="ltr"
                    inputMode="numeric"
                    value={portMax}
                    onChange={(e) => setPortMax(e.target.value.replace(/[^0-9]/g, ""))}
                    className="text-left font-mono"
                  />
                </Field>
              </div>
            )}
            {portMode === "pool" && (
              <div className="mt-4 flex flex-wrap gap-2">
                {POPULAR_PORTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePoolPort(p)}
                    className={cn(
                      "rounded-xl px-3.5 py-2 font-mono text-xs font-bold transition-all",
                      portPool.includes(p)
                        ? "bg-gradient-to-l from-violet-500 to-indigo-500 text-white shadow-lg"
                        : "bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* خلاصه */}
          <div className="glass-soft mt-5 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-400">
            <span className="text-base font-black text-white">{faNum(count)} کانفیگ</span>{" "}
            {protocol === "mixed" ? "مخلوط" : PROTOCOL_META[protocol as Protocol]?.label}
            {hostMode === "rotate" && hosts.length > 0 && (
              <>
                {" "}
                روی <span className="font-bold text-cyan-300">{faNum(hosts.length)} سرور</span>
              </>
            )}{" "}
            با SNI و Path تصادفی (در حالت خودکار) ساخته می‌شود.
          </div>
        </div>
      </div>

      {/* اکشن + پیشرفت */}
      <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs leading-relaxed text-slate-400 sm:text-right">
            {busy
              ? "دسته‌ها پشت سر هم ساخته و ذخیره می‌شوند…"
              : "بدون نیاز به هیچ تنظیمی — فقط دکمه تولید را بزنید."}
          </p>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            {busy && (
              <Button variant="danger" onClick={() => (abortRef.current = true)}>
                توقف
              </Button>
            )}
            <Button onClick={generate} disabled={busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              {busy ? "در حال تولید…" : `تولید ${faNum(count)} کانفیگ`}
            </Button>
          </div>
        </div>

        {busy && progress.total > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300">
                {faNum(progress.done)} از {faNum(progress.total)}
              </span>
              <span className="font-mono text-cyan-300">{faNum(pct)}٪</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-cyan-400 via-violet-500 to-fuchsia-500"
                animate={{ width: `${pct}%` }}
                transition={{ ease: "easeOut", duration: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* نتیجه */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass mt-6 rounded-3xl border-emerald-400/20 p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25">
              <CheckCircle2 className="size-5.5" />
            </span>
            <div>
              <h3 className="text-base font-extrabold text-white">
                {faNum(result.created)} کانفیگ ساخته شد
              </h3>
              <p className="text-xs text-slate-400">
                همه به‌صورت خودکار در اشتراک‌های «همه کانفیگ‌ها» قرار گرفتند.
              </p>
            </div>
          </div>

          {result.shares.length > 0 ? (
            <>
              <MonoBox
                text={result.shares[0]}
                className="mt-4 max-h-20 whitespace-normal break-all"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="soft"
                  onClick={async () => {
                    if (await copyText(result.shares.join("\n")))
                      push("همه لینک‌ها کپی شد");
                  }}
                >
                  <Copy className="size-4" />
                  کپی {faNum(result.shares.length)} لینک
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const blob = new Blob([result.shares.join("\n")], {
                      type: "text/plain",
                    });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `configs-${result.created}.txt`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  <Download className="size-4" />
                  دانلود فایل متنی
                </Button>
                <Link href="/configs">
                  <Button variant="ghost">مشاهده در فهرست</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-[11px] leading-relaxed text-slate-400">
              برای حجم‌های بالا، لینک‌ها در حافظه مرورگر نگه داشته نمی‌شوند.
              برای خروجی گرفتن از همه کانفیگ‌ها:
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="/api/configs/export?limit=500000" download>
                  <Button variant="soft">
                    <Download className="size-4" />
                    دانلود خروجی از سرور (تا ۵۰۰ هزار)
                  </Button>
                </a>
                <Link href="/configs">
                  <Button variant="ghost">مشاهده فهرست کانفیگ‌ها</Button>
                </Link>
                <Link href="/subs">
                  <Button variant="ghost">استفاده از لینک اشتراک</Button>
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
