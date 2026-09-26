"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Boxes,
  Copy,
  Download,
  FileDown,
  Loader2,
  Pencil,
  PlusCircle,
  QrCode,
  Search,
  Trash2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ConfigForm from "@/components/config-form";
import { useToast } from "@/components/providers";
import QrModal from "@/components/qr-modal";
import {
  Button,
  copyText,
  EmptyState,
  Modal,
  PageHeader,
  ProBadge,
  Spinner,
  TextInput,
  Toggle,
} from "@/components/primitives";
import { PROTOCOL_LIST, PROTOCOL_META } from "@/lib/constants";
import type { ConfigWithShare, Protocol } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 48;
const faNum = (n: number) => n.toLocaleString("fa-IR");

interface PageData {
  items: ConfigWithShare[];
  total: number;
  hasMore: boolean;
}

export default function ConfigsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<ConfigWithShare[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [proto, setProto] = useState<"all" | Protocol>("all");
  const [editing, setEditing] = useState<ConfigWithShare | null>(null);
  const [qr, setQr] = useState<ConfigWithShare | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqSeq = useRef(0);

  // دیبانس جستجو
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(
    async (p: number): Promise<PageData> => {
      const params = new URLSearchParams({
        page: String(p),
        pageSize: String(PAGE_SIZE),
        protocol: proto,
      });
      if (debouncedQuery) params.set("q", debouncedQuery);
      const res = await fetch(`/api/configs?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    },
    [proto, debouncedQuery]
  );

  // بارگذاری اولیه / وقتی فیلتر عوض شد
  useEffect(() => {
    const seq = ++reqSeq.current;
    setItems(null);
    fetchPage(1)
      .then((d) => {
        if (seq !== reqSeq.current) return;
        setItems(d.items);
        setTotal(d.total);
        setPage(1);
        setHasMore(d.hasMore);
      })
      .catch(() => {
        if (seq !== reqSeq.current) return;
        setItems([]);
        push("خطا در دریافت کانفیگ‌ها", "error");
      });
  }, [fetchPage, push]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const d = await fetchPage(page + 1);
      setItems((prev) => [...(prev ?? []), ...d.items]);
      setTotal(d.total);
      setPage(page + 1);
      setHasMore(d.hasMore);
    } catch {
      push("خطا در بارگذاری", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  /** رفرش همه صفحات لودشده (بعد از ویرایش) */
  async function refetchLoaded() {
    try {
      const all: ConfigWithShare[] = [];
      let last: PageData | null = null;
      for (let p = 1; p <= page; p++) {
        last = await fetchPage(p);
        all.push(...last.items);
      }
      setItems(all);
      if (last) {
        setTotal(last.total);
        setHasMore(last.hasMore);
      }
    } catch {
      push("خطا در به‌روزرسانی", "error");
    }
  }

  async function toggleEnabled(c: ConfigWithShare) {
    setItems(
      (prev) =>
        prev?.map((i) => (i.id === c.id ? { ...i, enabled: !c.enabled } : i)) ??
        prev
    );
    const res = await fetch(`/api/configs/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !c.enabled }),
    });
    if (!res.ok) {
      push("خطا در تغییر وضعیت", "error");
      refetchLoaded();
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/configs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
      setTotal((t) => Math.max(0, t - 1));
      push("کانفیگ حذف شد");
    } else {
      push("خطا در حذف", "error");
    }
    setConfirmId(null);
  }

  async function copyVisible() {
    if (!items?.length) return;
    const text = items.map((c) => c.share).join("\n");
    if (await copyText(text)) push(`${faNum(items.length)} لینک کپی شد`);
  }

  const exportParams = new URLSearchParams({ protocol: proto, limit: "500000" });
  if (debouncedQuery) exportParams.set("q", debouncedQuery);

  return (
    <div>
      <PageHeader
        title="کانفیگ‌ها"
        desc={`مدیریت کامل کانفیگ‌ها با جستجوی سروری — مجموع فعلی: ${faNum(total)} کانفیگ`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/import">
              <Button variant="ghost">
                <Download className="size-4" />
                وارد کردن
              </Button>
            </Link>
            <Link href="/bulk">
              <Button variant="soft">
                <Zap className="size-4" />
                ساخت انبوه
              </Button>
            </Link>
            <Link href="/configs/new">
              <Button>
                <PlusCircle className="size-4" />
                کانفیگ جدید
              </Button>
            </Link>
          </div>
        }
      />

      {/* نوار ابزار */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`جستجو در ${faNum(total)} کانفیگ…`}
            className="pr-10"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {(["all", ...PROTOCOL_LIST] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProto(p)}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                proto === p
                  ? "bg-gradient-to-l from-violet-500 to-indigo-500 text-white shadow-lg"
                  : "bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:text-white"
              )}
            >
              {p === "all" ? "همه" : PROTOCOL_META[p].label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(items?.length ?? 0) > 0 && (
            <Button variant="ghost" onClick={copyVisible} className="shrink-0">
              <Copy className="size-4" />
              کپی {faNum(items!.length)} لینک صفحه
            </Button>
          )}
          <a href={`/api/configs/export?${exportParams}`} download className="shrink-0">
            <Button variant="ghost" title="دانلود همه نتایج به‌صورت فایل متنی">
              <FileDown className="size-4" />
              خروجی همه
            </Button>
          </a>
        </div>
      </div>

      {/* بدنه */}
      {items === null ? (
        <Spinner label="در حال بارگذاری…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Boxes className="size-7" />}
          title={total === 0 ? "هنوز کانفیگی ندارید" : "نتیجه‌ای پیدا نشد"}
          desc={
            total === 0
              ? "با ساخت خودکار یا ساخت انبوه، در چند ثانیه هزاران کانفیگ تولید کنید."
              : "عبارت جستجو یا فیلتر پروتکل را تغییر دهید."
          }
          action={
            total === 0 ? (
              <div className="flex gap-2">
                <Link href="/configs/new">
                  <Button>
                    <PlusCircle className="size-4" />
                    ساخت خودکار
                  </Button>
                </Link>
                <Link href="/bulk">
                  <Button variant="soft">
                    <Zap className="size-4" />
                    ساخت انبوه
                  </Button>
                </Link>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          <motion.div layout className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {items.map((c, i) => (
                <motion.div
                  layout
                  key={c.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{
                    duration: 0.35,
                    delay: Math.min((i % PAGE_SIZE) * 0.02, 0.4),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={cn(
                    "glass group relative overflow-hidden rounded-2xl p-4 transition-colors",
                    !c.enabled && "opacity-55 saturate-50"
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-gradient-to-b to-transparent opacity-0 blur-2xl transition-opacity group-hover:opacity-100",
                      PROTOCOL_META[c.protocol as Protocol]?.glow ?? "from-white/20"
                    )}
                  />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ProBadge protocol={c.protocol} />
                      <p className="truncate text-sm font-extrabold text-white">
                        {c.name}
                      </p>
                    </div>
                    <Toggle checked={c.enabled} onChange={() => toggleEnabled(c)} />
                  </div>
                  <p
                    dir="ltr"
                    className="relative mt-2.5 truncate text-left font-mono text-[11px] text-slate-500"
                  >
                    {c.host}:{c.port}
                  </p>
                  <div className="relative mt-3 flex items-center gap-1.5 text-[10px]">
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 font-bold text-slate-400 ring-1 ring-white/[0.07]">
                      {c.transport.toUpperCase()}
                    </span>
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 font-bold text-slate-400 ring-1 ring-white/[0.07]">
                      {c.security.toUpperCase()}
                    </span>
                    {c.enabled && (
                      <span className="mr-auto flex items-center gap-1 font-bold text-emerald-400">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                        در اشتراک
                      </span>
                    )}
                  </div>
                  <div className="relative mt-3.5 flex gap-1.5 border-t border-white/[0.06] pt-3">
                    <CopyShareBtn share={c.share} />
                    <button
                      onClick={() => setQr(c)}
                      title="QR Code"
                      className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-slate-400 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <QrCode className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setEditing(c)}
                      title="ویرایش"
                      className="grid size-8 place-items-center rounded-lg bg-white/[0.05] text-slate-400 ring-1 ring-white/10 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {confirmId === c.id ? (
                      <button
                        onClick={() => remove(c.id)}
                        className="mr-auto rounded-lg bg-rose-500/20 px-2.5 text-[10px] font-extrabold text-rose-300 ring-1 ring-rose-400/40 transition-colors hover:bg-rose-500/30"
                      >
                        مطمئنی؟ حذف
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmId(c.id);
                          setTimeout(
                            () => setConfirmId((v) => (v === c.id ? null : v)),
                            3000
                          );
                        }}
                        title="حذف"
                        className="mr-auto grid size-8 place-items-center rounded-lg bg-white/[0.05] text-slate-500 ring-1 ring-white/10 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* بارگذاری بیشتر */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-[11px] text-slate-500">
              نمایش {faNum(items.length)} از {faNum(total)} کانفیگ
            </p>
            {hasMore && (
              <Button variant="ghost" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Boxes className="size-4" />
                )}
                {loadingMore ? "در حال بارگذاری…" : "بارگذاری بیشتر"}
              </Button>
            )}
          </div>
        </>
      )}

      {/* مودال ویرایش */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`ویرایش: ${editing?.name ?? ""}`}
        wide
      >
        {editing && (
          <ConfigForm
            editId={editing.id}
            initial={editing}
            onSaved={() => {
              setEditing(null);
              refetchLoaded();
            }}
          />
        )}
      </Modal>

      <QrModal
        open={!!qr}
        onClose={() => setQr(null)}
        text={qr?.share ?? ""}
        title={qr?.name ?? "کانفیگ"}
      />
    </div>
  );
}

function CopyShareBtn({ share }: { share: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(share)) {
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }
      }}
      className={cn(
        "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-extrabold transition-all",
        ok
          ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/25 hover:bg-violet-500/25"
      )}
    >
      <Copy className="size-3.5" />
      {ok ? "کپی شد" : "کپی لینک"}
    </button>
  );
}
