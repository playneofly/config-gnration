"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Database,
  Gauge,
  Layers,
  RefreshCw,
  Radio,
  ShieldCheck,
  SignalHigh,
  Zap,
} from "lucide-react";
import { PageHeader, ProtocolBadge } from "@/components/shared";
import { faNum, timeAgoFa, cn } from "@/lib/utils";
import type { Protocol } from "@/lib/types";

interface Stats {
  total: number;
  alive: number;
  dead: number;
  unknown: number;
  enabled: number;
  avgLatency: number;
  byProtocol: { protocol: string; value: number }[];
  recentRuns: {
    id: number;
    inserted: number;
    duplicates: number;
    tested: number;
    aliveCount: number;
    sourcesOk: number;
    sourcesTotal: number;
    createdAt: string;
  }[];
  lastTestedAt: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const total = stats?.total ?? 0;
  const alivePct = total ? Math.round(((stats?.alive ?? 0) / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="داشبورد"
        desc="نمای زنده از مخزن کانفیگ‌های واقعی — هر کانفیگ از منابع عمومی به‌روز جمع‌آوری و با اتصال TCP واقعی آزمایش می‌شود."
        actions={
          <>
            <button
              onClick={load}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              به‌روزرسانی
            </button>
            <Link
              href="/bulk"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:brightness-110"
            >
              <Layers className="size-4" strokeWidth={2.5} />
              ساخت دسته‌ای جدید
            </Link>
          </>
        }
      />

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={<Database className="size-5" />}
          tone="cyan"
          label="کل کانفیگ‌ها"
          value={stats ? faNum(stats.total) : "…"}
          foot={`${stats ? faNum(stats.enabled) : "…"} فعال`}
        />
        <StatCard
          icon={<ShieldCheck className="size-5" />}
          tone="emerald"
          label="سالم و آماده"
          value={stats ? faNum(stats.alive) : "…"}
          foot={total ? `${faNum(alivePct)}٪ از کل مخزن` : "—"}
        />
        <StatCard
          icon={<SignalHigh className="size-5" />}
          tone="violet"
          label="میانگین پینگ"
          value={stats && stats.avgLatency ? `${faNum(stats.avgLatency)}ms` : "—"}
          foot={stats?.lastTestedAt ? `آخرین تست: ${timeAgoFa(stats.lastTestedAt)}` : "هنوز تستی نشده"}
        />
        <StatCard
          icon={<Activity className="size-5" />}
          tone="rose"
          label="قطع / تست‌نشده"
          value={stats ? faNum(stats.dead) : "…"}
          foot={`${stats ? faNum(stats.unknown) : "…"} در صف تست`}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* توزیع پروتکل‌ها */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-3xl p-6 lg:col-span-3"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Gauge className="size-4 text-cyan-300" />
              توزیع پروتکل‌ها
            </h2>
            <Link href="/configs" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
              مشاهده همه ←
            </Link>
          </div>
          {stats && stats.byProtocol.length > 0 ? (
            <ul className="space-y-3.5">
              {stats.byProtocol
                .sort((a, b) => b.value - a.value)
                .map((p) => {
                  const pct = total ? (p.value / total) * 100 : 0;
                  return (
                    <li key={p.protocol}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <ProtocolBadge protocol={p.protocol as Protocol} />
                        <span className="num text-xs font-bold text-zinc-300">
                          {faNum(p.value)}
                          <span className="mr-1.5 text-zinc-600">({faNum(Math.round(pct))}٪)</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-l from-cyan-400 to-violet-500"
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <EmptyNote
              text={loading ? "در حال بارگذاری…" : "هنوز هیچ کانفیگی در مخزن نیست. یک ساخت دسته‌ای اجرا کنید."}
            />
          )}
        </motion.section>

        {/* آخرین همگام‌سازی‌ها */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 lg:col-span-2"
        >
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-white">
            <RefreshCw className="size-4 text-violet-300" />
            آخرین ساخت‌های دسته‌ای
          </h2>
          {stats && stats.recentRuns.length > 0 ? (
            <ul className="space-y-3">
              {stats.recentRuns.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="num text-sm font-extrabold text-emerald-300">
                      +{faNum(r.inserted)}
                      <span className="mr-1 text-[11px] font-medium text-zinc-500">جدید</span>
                    </span>
                    <span className="text-[11px] text-zinc-500">{timeAgoFa(r.createdAt)}</span>
                  </div>
                  <div className="num mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
                    <span>تست‌شده: {faNum(r.tested)}</span>
                    <span className="text-emerald-400/80">سالم: {faNum(r.aliveCount)}</span>
                    <span>
                      منابع: {faNum(r.sourcesOk)}/{faNum(r.sourcesTotal)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyNote text={loading ? "در حال بارگذاری…" : "هنوز همگام‌سازی انجام نشده است."} />
          )}
        </motion.section>
      </div>

      {/* اکشن‌های سریع */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/generate"
          className="glass glass-hover group relative overflow-hidden rounded-3xl p-6"
        >
          <div className="absolute -left-10 -top-10 size-40 rounded-full bg-cyan-500/10 blur-3xl transition group-hover:bg-cyan-500/20" />
          <Zap className="mb-4 size-7 text-cyan-300" />
          <h3 className="text-lg font-extrabold text-white">ساخت تکی</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-zinc-400">
            یک کانفیگ واقعیِ تست‌شده و آماده اتصال، همراه QR — یا ساخت دستی با سرور خودتان.
          </p>
        </Link>
        <Link href="/subs" className="glass glass-hover group relative overflow-hidden rounded-3xl p-6">
          <div className="absolute -left-10 -top-10 size-40 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />
          <Radio className="mb-4 size-7 text-violet-300" />
          <h3 className="text-lg font-extrabold text-white">لینک اشتراک</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-zinc-400">
            یک لینک سابسکریپشن بسازید تا کلاینت شما همیشه جدیدترین کانفیگ‌های سالم را دریافت کند.
          </p>
        </Link>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  cyan: "from-cyan-400/15 to-cyan-400/0 text-cyan-300",
  emerald: "from-emerald-400/15 to-emerald-400/0 text-emerald-300",
  violet: "from-violet-400/15 to-violet-400/0 text-violet-300",
  rose: "from-rose-400/15 to-rose-400/0 text-rose-300",
};

function StatCard({
  icon,
  tone,
  label,
  value,
  foot,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-hover relative overflow-hidden rounded-3xl p-5"
    >
      <div className={cn("absolute inset-x-0 top-0 h-20 bg-gradient-to-b", TONES[tone])} />
      <div className="relative">
        <div className={cn("mb-4 inline-flex rounded-xl bg-white/[0.06] p-2.5 ring-1 ring-white/10", TONES[tone])}>
          {icon}
        </div>
        <p className="text-xs font-medium text-zinc-400">{label}</p>
        <p className="num mt-1 text-2xl font-black text-white sm:text-3xl">{value}</p>
        <p className="mt-1.5 text-[11px] text-zinc-500">{foot}</p>
      </div>
    </motion.div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/10 py-10 text-center">
      <p className="px-4 text-xs leading-6 text-zinc-500">{text}</p>
    </div>
  );
}
