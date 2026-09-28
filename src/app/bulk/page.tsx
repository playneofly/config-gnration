"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Database,
  Globe,
  Layers,
  Loader2,
  Radio,
  ShieldCheck,
  Timer,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared";
import { cn, faNum } from "@/lib/utils";
import type { SyncReport } from "@/lib/types";

const COUNTS = [100, 250, 500, 1000, 2500, 5000];

export default function BulkPage() {
  const [count, setCount] = useState(500);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SyncReport | null>(null);
  const [error, setError] = useState("");

  const run = async () => {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, test: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "خطا در ساخت دسته‌ای");
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="ساخت دسته‌ای"
        desc="جمع‌آوری کانفیگ‌های واقعی از منابع عمومیِ به‌روز، حذف تکراری‌ها و تست اتصال واقعی. دیگر خبری از UUID تصادفیِ الکی نیست."
      />

      <div className="glass rounded-3xl p-6 sm:p-8">
        <p className="mb-3 text-xs font-bold text-zinc-400">چند کانفیگ جدید وارد مخزن شود؟</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              disabled={busy}
              className={cn(
                "num cursor-pointer rounded-2xl border py-3.5 text-sm font-extrabold transition-all",
                count === c
                  ? "border-cyan-400/50 bg-cyan-400/[0.1] text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                  : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
              )}
            >
              {faNum(c)}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-[11px] leading-6 text-zinc-500">
          <Globe className="mt-0.5 size-4 shrink-0 text-zinc-400" />
          <p>
            حداکثر {faNum(5000)} در هر بار. کانفیگ‌های تکراری (با اثرانگشت یکتا) به‌صورت خودکار حذف می‌شوند،
            پس اجرای دوباره فقط موارد جدید را اضافه می‌کند. تا {faNum(150)} کانفیگ تازه هم بلافاصله تست اتصال
            واقعی می‌شوند. ساخت ۱ میلیون کانفیگ الکی دیگر پشتیبانی نمی‌شود — چون آن‌ها واقعی نبودند و هیچ‌وقت کار نمی‌کردند.
          </p>
        </div>

        <button
          onClick={run}
          disabled={busy}
          className={cn(
            "mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-cyan-400 to-violet-500 px-6 py-4 text-[15px] font-black text-zinc-950 shadow-[0_0_36px_rgba(34,211,238,0.35)] transition",
            busy ? "cursor-wait opacity-75" : "hover:brightness-110 active:scale-[0.995]"
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Layers className="size-5" strokeWidth={2.5} />}
          {busy ? "در حال جمع‌آوری، حذف تکراری و تست اتصال…" : `شروع ساخت ${faNum(count)} کانفیگ`}
        </button>

        {busy && (
          <div className="mt-4 overflow-hidden rounded-full bg-white/[0.05]">
            <div className="shimmer h-1.5 w-full" />
          </div>
        )}

        {error && (
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-rose-400/10 px-4 py-3 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/25">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 space-y-4"
          >
            {/* خلاصه */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <ReportStat icon={<Database className="size-4" />} label="لینک دریافتی" value={faNum(report.fetchedLines)} tone="text-zinc-200" />
              <ReportStat icon={<CheckCircle2 className="size-4" />} label="جدیدِ ذخیره‌شده" value={faNum(report.inserted)} tone="text-emerald-300" glow />
              <ReportStat icon={<ShieldCheck className="size-4" />} label="سالم در تست" value={faNum(report.aliveCount)} tone="text-cyan-300" />
              <ReportStat icon={<Timer className="size-4" />} label="زمان اجرا" value={faNum(Math.round(report.durationMs / 1000)) + " ثانیه"} tone="text-violet-300" />
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <Radio className="size-4 text-cyan-300" />
                  جزئیات منابع
                </h3>
                <span className="num text-[11px] text-zinc-500">
                  تکراری: {faNum(report.duplicates)} • نامعتبر: {faNum(report.failed)} • تست‌شده: {faNum(report.tested)}
                </span>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {report.sources.map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                      {s.ok ? (
                        <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-rose-400" />
                      )}
                      {s.name}
                    </span>
                    <span className="num text-[11px] text-zinc-500">
                      {s.ok ? `${faNum(s.lines)} لینک` : "در دسترس نبود"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/configs"
              className="glass glass-hover flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-cyan-300"
            >
              مشاهده کانفیگ‌های ساخته‌شده ←
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportStat({ icon, label, value, tone, glow }: { icon: React.ReactNode; label: string; value: string; tone: string; glow?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl p-4", glow && "ring-1 ring-emerald-400/30")}>
      <div className={cn("flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400", tone)}>
        {icon}
        {label}
      </div>
      <p className={cn("num mt-2 text-xl font-black", tone)}>{value}</p>
    </div>
  );
}
