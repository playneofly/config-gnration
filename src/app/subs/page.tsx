"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Link2, Loader2, Plus, Radio, Share2, Trash2 } from "lucide-react";
import { PageHeader, CopyButton, QrButton } from "@/components/shared";
import { cn, faNum, timeAgoFa } from "@/lib/utils";

interface SubItem {
  id: number;
  name: string;
  token: string;
  onlyAlive: boolean;
  maxConfigs: number;
  createdAt: string;
}

export default function SubsPage() {
  const [items, setItems] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/subs", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setItems(json.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setOrigin(window.location.origin);
  }, [load]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined }),
      });
      if (res.ok) {
        setName("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setItems((p) => p.filter((s) => s.id !== id));
    await fetch(`/api/subs/${id}`, { method: "DELETE" });
  };

  const toggleOnlyAlive = async (sub: SubItem) => {
    setItems((p) => p.map((s) => (s.id === sub.id ? { ...s, onlyAlive: !sub.onlyAlive } : s)));
    await fetch(`/api/subs/${sub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onlyAlive: !sub.onlyAlive }),
    });
  };

  const subUrl = (token: string) => `${origin}/api/sub/${token}`;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="لینک‌های اشتراک"
        desc="این لینک را در کلاینت (v2rayNG، Streisand، V2Box…) بگذارید تا همیشه جدیدترین کانفیگ‌های سالم مخزن را خودکار دریافت کند."
      />

      {/* ساخت اشتراک */}
      <div className="glass mb-6 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
          placeholder="نام اشتراک (مثلاً: موبایل من)"
          className="field flex-1"
          maxLength={60}
        />
        <button
          onClick={create}
          disabled={busy}
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-400 to-violet-500 px-6 py-3 text-sm font-black text-zinc-950 transition",
            busy ? "opacity-70" : "hover:brightness-110"
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" strokeWidth={2.5} />}
          ساخت لینک اشتراک
        </button>
      </div>

      {/* لیست */}
      {loading ? (
        <div className="grid gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="glass h-36 rounded-3xl p-5">
              <div className="shimmer h-full rounded-2xl" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl py-20 text-center">
          <Share2 className="mb-3 size-10 text-zinc-600" />
          <p className="text-sm font-bold text-zinc-300">هنوز اشتراکی نساخته‌اید</p>
          <p className="mt-1.5 text-xs text-zinc-500">با فرم بالا اولین لینک اشتراک خود را بسازید.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {items.map((sub) => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-3xl p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-violet-400/10 ring-1 ring-violet-400/30">
                      <Radio className="size-5 text-violet-300" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-white">{sub.name}</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        ساخته‌شده {timeAgoFa(sub.createdAt)} • حداکثر {faNum(sub.maxConfigs)} کانفیگ
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleOnlyAlive(sub)}
                      className={cn(
                        "cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 transition",
                        sub.onlyAlive
                          ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25"
                          : "bg-zinc-400/10 text-zinc-400 ring-zinc-400/20"
                      )}
                      title="اگر فعال باشد فقط کانفیگ‌های تست‌شده و سالم ارسال می‌شوند"
                    >
                      {sub.onlyAlive ? "✓ فقط سالم‌ها" : "همه کانفیگ‌ها"}
                    </button>
                    <button
                      onClick={() => remove(sub.id)}
                      className="grid size-8 cursor-pointer place-items-center rounded-lg bg-rose-400/[0.07] text-zinc-300 ring-1 ring-white/10 transition hover:bg-rose-400/15 hover:text-rose-300"
                      aria-label="حذف اشتراک"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/40 px-4 py-3" dir="ltr">
                  <Link2 className="size-4 shrink-0 text-zinc-500" />
                  <code className="flex-1 truncate text-left text-[11px] text-cyan-200/80">{subUrl(sub.token)}</code>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton small text={subUrl(sub.token)} label="کپی لینک اشتراک" className="flex-1 sm:flex-none" />
                  <QrButton small text={subUrl(sub.token)} title={`اشتراک ${sub.name}`} />
                  <a
                    href={subUrl(sub.token)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
                  >
                    <ExternalLink className="size-3.5" />
                    باز کردن
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
