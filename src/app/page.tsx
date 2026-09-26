"use client";

import { animate, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Boxes,
  Clapperboard,
  Globe2,
  PlusCircle,
  Rss,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  ProBadge,
  Spinner,
} from "@/components/primitives";
import QuickAutoCreate from "@/components/quick-auto";
import { PROTOCOL_META } from "@/lib/constants";
import type { Protocol } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

interface Stats {
  total: number;
  active: number;
  subs: number;
  distinctHosts: number;
  byProtocol: Record<string, number>;
  recent: {
    id: number;
    name: string;
    protocol: string;
    host: string;
    port: number;
    enabled: boolean;
    createdAt: string;
  }[];
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span>{display.toLocaleString("fa-IR")}</span>;
}

const stagger = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.07 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const totalForShare = Math.max(stats?.total ?? 0, 1);

  return (
    <div>
      {/* هیرو */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14"
      >
        <div className="absolute -left-20 -top-28 size-72 rounded-full bg-violet-600/25 blur-[110px]" />
        <div className="absolute -bottom-32 right-1/4 size-64 rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-bold text-violet-200 ring-1 ring-violet-400/25">
            <Zap className="size-3.5 text-cyan-300" />
            ساخت نامحدود کانفیگ — بدون سقف، بدون محدودیت
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-black leading-[1.25] tracking-tight text-white sm:text-5xl sm:leading-[1.2]">
            کارخانه ساخت
            <span className="text-shine"> کانفیگ</span>
            <br />
            با یک کلیک، صدها کانفیگ
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            VLESS، VMess، Trojan، Shadowsocks و WireGuard را با ترنسپورت‌های WS،
            gRPC و Reality بسازید؛ همه را در یک لینک اشتراک واحد با خروجی
            v2ray، sing-box و Clash تحویل بگیرید.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/configs/new">
              <Button>
                <PlusCircle className="size-4" />
                ساخت کانفیگ جدید
              </Button>
            </Link>
            <Link href="/bulk">
              <Button variant="soft">
                <Zap className="size-4" />
                ساخت انبوه (تا ۱,۰۰۰,۰۰۰ تایی)
              </Button>
            </Link>
            <Link href="/subs">
              <Button variant="ghost">
                <Rss className="size-4" />
                دریافت لینک اشتراک
              </Button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* ساخت خودکار با یک کلیک */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <QuickAutoCreate />
      </motion.div>

      {/* آمار */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "کل کانفیگ‌ها", value: stats?.total, icon: Boxes, tone: "text-violet-300 bg-violet-500/10 ring-violet-400/20" },
          { label: "کانفیگ‌های فعال", value: stats?.active, icon: Activity, tone: "text-emerald-300 bg-emerald-500/10 ring-emerald-400/20" },
          { label: "سرورهای یکتا", value: stats?.distinctHosts, icon: Globe2, tone: "text-cyan-300 bg-cyan-500/10 ring-cyan-400/20" },
          { label: "لینک‌های اشتراک", value: stats?.subs, icon: Rss, tone: "text-amber-300 bg-amber-500/10 ring-amber-400/20" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            custom={i + 1}
            variants={stagger}
            initial="hidden"
            animate="show"
            className="glass rounded-3xl p-5"
          >
            <div className={`grid size-10 place-items-center rounded-xl ring-1 ${s.tone}`}>
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 text-3xl font-black tracking-tight text-white">
              {s.value === undefined ? "—" : <AnimatedNumber value={s.value} />}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-400">{s.label}</p>
          </motion.div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* توزیع پروتکل‌ها */}
        <motion.div
          custom={5}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="glass rounded-3xl p-6 lg:col-span-2"
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <Clapperboard className="size-4.5 text-violet-300" />
            توزیع پروتکل‌ها
          </h2>
          {!stats ? (
            <Spinner />
          ) : (
            <div className="mt-5 space-y-4">
              {(Object.keys(PROTOCOL_META) as Protocol[]).map((p) => {
                const n = stats.byProtocol[p] ?? 0;
                const pct = Math.round((n / totalForShare) * 100);
                return (
                  <div key={p}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-bold text-slate-300">
                        <span className={`size-2 rounded-full ${PROTOCOL_META[p].dot}`} />
                        {PROTOCOL_META[p].label}
                      </span>
                      <span className="font-mono text-slate-500">
                        {n.toLocaleString("fa-IR")} · {pct.toLocaleString("fa-IR")}٪
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                        className={`h-full rounded-full ${PROTOCOL_META[p].dot} opacity-80`}
                      />
                    </div>
                  </div>
                );
              })}
              <Link
                href="/configs"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.04] py-2.5 text-xs font-bold text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                مشاهده همه کانفیگ‌ها
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          )}
        </motion.div>

        {/* آخرین کانفیگ‌ها */}
        <motion.div
          custom={6}
          variants={stagger}
          initial="hidden"
          animate="show"
          className="glass rounded-3xl p-6 lg:col-span-3"
        >
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <Server className="size-4.5 text-cyan-300" />
            آخرین کانفیگ‌های ساخته‌شده
          </h2>
          {!stats ? (
            <Spinner />
          ) : stats.recent.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-slate-400">
                هنوز کانفیگی نساخته‌اید — همین حالا شروع کنید.
              </p>
              <Link href="/configs/new" className="mt-4">
                <Button>
                  <PlusCircle className="size-4" />
                  اولین کانفیگ
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-white/[0.05]">
              {stats.recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <ProBadge protocol={c.protocol} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-200">{c.name}</p>
                    <p dir="ltr" className="truncate text-left font-mono text-[11px] text-slate-500">
                      {c.host}:{c.port}
                    </p>
                  </div>
                  <div className="text-left">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        c.enabled
                          ? "bg-emerald-400/10 text-emerald-300"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {c.enabled ? "فعال" : "غیرفعال"}
                    </span>
                    <p className="mt-1 text-[10px] text-slate-600">{fmtDate(c.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
