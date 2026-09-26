"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  QrCode,
  RefreshCcw,
  Rss,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/providers";
import QrModal from "@/components/qr-modal";
import {
  Button,
  EmptyState,
  Field,
  MonoBox,
  PageHeader,
  ProBadge,
  Segmented,
  Spinner,
  TextInput,
} from "@/components/primitives";
import { copyText } from "@/components/primitives";
import type { ConfigWithShare, SubscriptionDto } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";

export default function SubsPage() {
  const { push } = useToast();
  const [subs, setSubs] = useState<SubscriptionDto[] | null>(null);
  const [configs, setConfigs] = useState<ConfigWithShare[]>([]);
  const [totalConfigs, setTotalConfigs] = useState(0);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [qrText, setQrText] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const refresh = useCallback(() => {
    fetch("/api/subs")
      .then((r) => r.json())
      .then((d) => setSubs(d.items ?? []))
      .catch(() => setSubs([]));
    fetch("/api/configs?pageSize=100")
      .then((r) => r.json())
      .then((d) => {
        setConfigs(d.items ?? []);
        setTotalConfigs(d.total ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(refresh, [refresh]);

  const subUrl = (token: string, format?: string) =>
    `${origin}/api/sub/${token}${format ? `?format=${format}` : ""}`;

  const filteredConfigs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return configs;
    return configs.filter(
      (c) => c.name.toLowerCase().includes(q) || c.host.toLowerCase().includes(q)
    );
  }, [configs, search]);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          mode,
          configIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      push("اشتراک ساخته شد");
      setName("");
      setSelected(new Set());
      refresh();
    } catch (e) {
      push(e instanceof Error ? e.message : "خطا در ساخت اشتراک", "error");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(id: number) {
    const res = await fetch(`/api/subs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: true }),
    });
    if (res.ok) {
      push("لینک جدید صادر شد — لینک قبلی غیرفعال است");
      refresh();
    } else push("خطا در بازتولید لینک", "error");
  }

  async function remove(id: number) {
    const res = await fetch(`/api/subs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSubs((prev) => prev?.filter((s) => s.id !== id) ?? prev);
      push("اشتراک حذف شد");
    } else push("خطا در حذف", "error");
    setConfirmId(null);
  }

  return (
    <div>
      <PageHeader
        title="لینک‌های اشتراک"
        desc="هر اشتراک، یک URL دائمی است که کلاینت‌ها (v2rayNG، sing-box، Clash و…) به‌صورت خودکار از آن به‌روزرسانی می‌شوند."
      />

      {/* فرم ساخت */}
      <div className="glass mb-6 rounded-3xl p-5 sm:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-white">
          <Rss className="size-4 text-amber-300" />
          ساخت اشتراک جدید
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام اشتراک (مثلاً: اشتراک اصلی)"
            className="flex-1"
          />
          <Segmented<"all" | "selected">
            value={mode}
            onChange={setMode}
            className="sm:w-72"
            options={[
              { value: "all", label: `همه کانفیگ‌ها (${totalConfigs.toLocaleString("fa-IR")})` },
              { value: "selected", label: "انتخاب دستی" },
            ]}
          />
        </div>

        <AnimatePresence>
          {mode === "selected" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/20 p-3.5">
                <div className="mb-3 flex items-center gap-2">
                  <TextInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجوی کانفیگ…"
                    className="flex-1 py-2 text-xs"
                  />
                  <span className="shrink-0 rounded-lg bg-violet-500/15 px-2.5 py-2 text-[11px] font-bold text-violet-200 ring-1 ring-violet-400/25">
                    {selected.size.toLocaleString("fa-IR")} انتخاب‌شده
                  </span>
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto pl-1">
                  {filteredConfigs.map((c) => {
                    const on = selected.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleSelect(c.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-right transition-colors",
                          on ? "bg-violet-500/15 ring-1 ring-violet-400/25" : "hover:bg-white/[0.04]"
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-4.5 shrink-0 place-items-center rounded-md ring-1 transition-colors",
                            on
                              ? "bg-violet-500 text-white ring-violet-400"
                              : "bg-white/5 text-transparent ring-white/15"
                          )}
                        >
                          <Check className="size-3" />
                        </span>
                        <ProBadge protocol={c.protocol} />
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-200">
                          {c.name}
                        </span>
                        <span dir="ltr" className="font-mono text-[10px] text-slate-500">
                          {c.host}
                        </span>
                      </button>
                    );
                  })}
                  {filteredConfigs.length === 0 && (
                    <p className="py-6 text-center text-xs text-slate-500">
                      کانفیگی پیدا نشد — اول کانفیگ بسازید.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex justify-end">
          <Button onClick={create} disabled={busy || (mode === "selected" && selected.size === 0)}>
            <Rss className="size-4" />
            {busy ? "در حال ساخت…" : "ساخت اشتراک"}
          </Button>
        </div>
      </div>

      {/* فهرست اشتراک‌ها */}
      {subs === null ? (
        <Spinner />
      ) : subs.length === 0 ? (
        <EmptyState
          icon={<Rss className="size-7" />}
          title="هنوز اشتراکی نساخته‌اید"
          desc="با ساخت اشتراک، یک لینک دائمی می‌گیرید که تمام کانفیگ‌های فعال را تحویل می‌دهد."
        />
      ) : (
        <div className="space-y-4">
          {subs.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20">
                    <Rss className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">{s.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {fmtDate(s.createdAt)} ·{" "}
                      {s.mode === "all"
                        ? "شامل همه کانفیگ‌های فعال"
                        : `${(s.configIds?.length ?? 0).toLocaleString("fa-IR")} کانفیگ انتخابی`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQrText(subUrl(s.token))}
                    title="QR لینک اشتراک"
                    className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                  >
                    <QrCode className="size-4" />
                  </button>
                  <button
                    onClick={() => regenerate(s.id)}
                    title="بازتولید لینک"
                    className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-slate-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCcw className="size-4" />
                  </button>
                  {confirmId === s.id ? (
                    <button
                      onClick={() => remove(s.id)}
                      className="rounded-xl bg-rose-500/20 px-3 py-2 text-[11px] font-extrabold text-rose-300 ring-1 ring-rose-400/40 hover:bg-rose-500/30"
                    >
                      مطمئنی؟ حذف
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmId(s.id);
                        setTimeout(() => setConfirmId((v) => (v === s.id ? null : v)), 3000);
                      }}
                      title="حذف"
                      className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-slate-500 ring-1 ring-white/10 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <MonoBox text={subUrl(s.token)} className="flex-1" />
                <CopyLinkButton text={subUrl(s.token)} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(
                  [
                    { key: undefined, label: "v2ray / v2rayNG" },
                    { key: "singbox", label: "sing-box" },
                    { key: "clash", label: "Clash / Mihomo" },
                    { key: "raw", label: "متن خام" },
                  ] as const
                ).map((f) => (
                  <CopyFormatChip
                    key={f.label}
                    label={f.label}
                    text={subUrl(s.token, f.key)}
                    onCopied={() => push(`لینک ${f.label} کپی شد`)}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* راهنما */}
      <div className="glass-soft mt-6 rounded-3xl p-5 text-[12px] leading-relaxed text-slate-400">
        <p className="font-extrabold text-slate-200">راهنمای اتصال</p>
        <p className="mt-2">
          لینک اشتراک را در کلاینت خود (v2rayNG، v2rayN، Streisand، sing-box یا Clash) در
          بخش Subscription وارد کنید. تشخیص فرمت بر اساس User-Agent هم انجام می‌شود؛ یعنی
          همان لینک اصلی، در Clash به‌صورت خودکار YAML و در sing-box خروجی JSON می‌دهد.
        </p>
      </div>

      <QrModal
        open={!!qrText}
        onClose={() => setQrText(null)}
        text={qrText ?? ""}
        title="QR لینک اشتراک"
      />
    </div>
  );
}

function CopyLinkButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <Button
      variant="soft"
      className="shrink-0"
      onClick={async () => {
        if (await copyText(text)) {
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }
      }}
    >
      {ok ? <Check className="size-4" /> : <Copy className="size-4" />}
      {ok ? "کپی شد" : "کپی لینک"}
    </Button>
  );
}

function CopyFormatChip({
  label,
  text,
  onCopied,
}: {
  label: string;
  text: string;
  onCopied: () => void;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        if (await copyText(text)) {
          setOk(true);
          onCopied();
          setTimeout(() => setOk(false), 1500);
        }
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 transition-all",
        ok
          ? "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30"
          : "bg-white/[0.04] text-slate-400 ring-white/10 hover:bg-white/[0.08] hover:text-white"
      )}
    >
      {ok ? <Check className="size-3" /> : <Copy className="size-3" />}
      {label}
    </button>
  );
}
