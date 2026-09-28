"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Power,
  RefreshCw,
  Search,
  ShieldQuestion,
  Trash2,
  Zap,
} from "lucide-react";
import { PageHeader, ProtocolBadge, CopyButton, QrButton, StatusPill } from "@/components/shared";
import { cn, faNum, timeAgoFa } from "@/lib/utils";
import { PROTOCOL_META } from "@/lib/constants";
import type { ConfigWithShare, Protocol } from "@/lib/types";

interface ListResponse {
  items: ConfigWithShare[];
  total: number;
  page: number;
  totalPages: number;
}

const ALIVE_FILTERS = [
  { id: "all", label: "همه" },
  { id: "alive", label: "سالم" },
  { id: "dead", label: "قطع" },
  { id: "unknown", label: "تست‌نشده" },
] as const;

export default function ConfigsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [protocol, setProtocol] = useState<string>("all");
  const [alive, setAlive] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [testingIds, setTestingIds] = useState<Set<number>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMsg, setBatchMsg] = useState("");
  const firstRun = useRef(true);

  // دیبانس جستجو
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 450);
    return () => clearTimeout(t);
  }, [qInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "24",
        protocol,
        alive,
      });
      if (q) params.set("q", q);
      const res = await fetch(`/api/configs?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در دریافت");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت کانفیگ‌ها");
    } finally {
      setLoading(false);
    }
  }, [page, protocol, alive, q]);

  // ریست صفحه وقتی فیلترها عوض می‌شوند
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setPage(1);
  }, [protocol, alive, q]);

  useEffect(() => {
    load();
  }, [load]);

  const testOne = async (id: number) => {
    setTestingIds((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/configs/${id}/test`, { method: "POST" });
      const json = await res.json();
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((it) =>
                it.id === id ? { ...it, alive: json.alive, latency: json.latency, lastTestedAt: new Date().toISOString() } : it
              ),
            }
          : d
      );
    } finally {
      setTestingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  const removeOne = async (id: number) => {
    setData((d) => (d ? { ...d, items: d.items.filter((it) => it.id !== id), total: d.total - 1 } : d));
    await fetch(`/api/configs/${id}`, { method: "DELETE" });
  };

  const toggleEnabled = async (item: ConfigWithShare) => {
    setData((d) =>
      d ? { ...d, items: d.items.map((it) => (it.id === item.id ? { ...it, enabled: !item.enabled } : it)) } : d
    );
    await fetch(`/api/configs/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !item.enabled }),
    });
  };

  const batchTest = async () => {
    setBatchBusy(true);
    setBatchMsg("");
    try {
      const res = await fetch("/api/configs/test-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 40 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا");
      setBatchMsg(`تست ${faNum(json.tested)} کانفیگ انجام شد — ${faNum(json.alive)} سالم`);
      load();
    } catch (e) {
      setBatchMsg(e instanceof Error ? e.message : "خطا در تست گروهی");
    } finally {
      setBatchBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="کانفیگ‌ها"
        desc="مخزن کانفیگ‌های واقعی. تست تکی و گروهی با اتصال TCP واقعی انجام می‌شود."
        actions={
          <>
            {batchMsg && <span className="text-[11px] font-semibold text-emerald-300">{batchMsg}</span>}
            <button
              onClick={batchTest}
              disabled={batchBusy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1] disabled:opacity-60"
            >
              {batchBusy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 text-amber-300" />}
              تست گروهی (۴۰ تایی)
            </button>
            <button
              onClick={() => load()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              تازه‌سازی
            </button>
          </>
        }
      />

      {/* فیلترها */}
      <div className="glass mb-5 flex flex-col gap-3 rounded-2xl p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="جستجو در نام یا آدرس سرور…"
            className="field pr-10"
          />
        </div>
        <select value={protocol} onChange={(e) => { setProtocol(e.target.value); setPage(1); }} className="field lg:w-44">
          <option value="all">همه پروتکل‌ها</option>
          {(Object.keys(PROTOCOL_META) as Protocol[]).map((p) => (
            <option key={p} value={p}>{PROTOCOL_META[p].label}</option>
          ))}
        </select>
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1">
          {ALIVE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setAlive(f.id); setPage(1); }}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all",
                alive === f.id ? "bg-white/[0.09] text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* خطا */}
      {error && (
        <div className="mb-5 rounded-2xl bg-rose-400/10 px-5 py-4 text-sm font-semibold text-rose-300 ring-1 ring-rose-400/25">
          {error}
        </div>
      )}

      {/* لیست */}
      {loading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass h-40 rounded-3xl p-5">
              <div className="shimmer h-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl py-20 text-center">
          <ShieldQuestion className="mb-3 size-10 text-zinc-600" />
          <p className="text-sm font-bold text-zinc-300">هیچ کانفیگی پیدا نشد</p>
          <p className="mt-1.5 max-w-sm text-xs leading-6 text-zinc-500">
            فیلترها را تغییر دهید یا از بخش «ساخت دسته‌ای» کانفیگ واقعی وارد مخزن کنید.
          </p>
        </div>
      ) : (
        <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", loading && "pointer-events-none opacity-60")}>
          <AnimatePresence mode="popLayout">
            {data?.items.map((item) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  "glass glass-hover group flex flex-col rounded-3xl p-5",
                  item.enabled === false && "opacity-50"
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-white">{item.name}</h3>
                    <p className="num mt-1 truncate text-[11px] text-zinc-500" dir="ltr">
                      {item.host}:{item.port}
                    </p>
                  </div>
                  <ProtocolBadge protocol={item.protocol} />
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StatusPill alive={item.alive} latency={item.latency} />
                  <span className="text-[10px] text-zinc-600">
                    {item.lastTestedAt ? `تست: ${timeAgoFa(item.lastTestedAt)}` : `منبع: ${item.source}`}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.06] pt-3">
                  <CopyButton small text={item.share} className="flex-1" />
                  <QrButton small text={item.share} title={item.name} />
                  <IconAction
                    title="تست اتصال"
                    onClick={() => testOne(item.id)}
                    disabled={testingIds.has(item.id)}
                  >
                    {testingIds.has(item.id) ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Zap className="size-3.5" />
                    )}
                  </IconAction>
                  <IconAction title={item.enabled ? "غیرفعال" : "فعال"} onClick={() => toggleEnabled(item)}>
                    <Power className={cn("size-3.5", item.enabled ? "text-emerald-300" : "text-zinc-500")} />
                  </IconAction>
                  <IconAction danger title="حذف" onClick={() => removeOne(item.id)}>
                    <Trash2 className="size-3.5" />
                  </IconAction>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* صفحه‌بندی */}
      {data && data.totalPages > 1 && (
        <div className="num mt-6 flex items-center justify-center gap-3">
          <PaginationBtn disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight className="size-4" />
            قبلی
          </PaginationBtn>
          <span className="text-xs font-bold text-zinc-400">
            صفحه {faNum(data.page)} از {faNum(data.totalPages)}
            <span className="mr-2 text-zinc-600">({faNum(data.total)} کانفیگ)</span>
          </span>
          <PaginationBtn disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            بعدی
            <ChevronLeft className="size-4" />
          </PaginationBtn>
        </div>
      )}
    </div>
  );
}

function IconAction({
  children,
  onClick,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg text-zinc-300 ring-1 ring-white/10 transition disabled:opacity-50",
        danger ? "bg-rose-400/[0.07] hover:bg-rose-400/15 hover:text-rose-300" : "bg-white/[0.06] hover:bg-white/[0.12]"
      )}
    >
      {children}
    </button>
  );
}

function PaginationBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-bold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
