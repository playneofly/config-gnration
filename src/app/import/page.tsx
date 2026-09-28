"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileUp, Loader2, ScanText, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { cn, faNum } from "@/lib/utils";

interface ImportResult {
  parsed: number;
  inserted: number;
  duplicates: number;
  failed: number;
}

export default function ImportPage() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const detected = useMemo(() => {
    const t = text.trim();
    if (!t) return 0;
    return t.split(/\r?\n/).filter((l) => l.trim().includes("://")).length + (t.includes("://") ? 0 : t.length > 40 ? 1 : 0);
  }, [text]);

  const run = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در وارد کردن");
      setResult(json);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ناشناخته");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="وارد کردن کانفیگ"
        desc="لینک‌های خودتان را اینجا بچسبانید — هر خط یک لینک، یا کل محتوای base64 یک سابسکریپشن. تکراری‌ها خودکار حذف می‌شوند."
      />

      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="mb-2 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <ScanText className="size-4 text-cyan-300" />
            لینک‌ها یا محتوای سابسکریپشن
          </label>
          <span className="num text-[11px] text-zinc-500">
            {detected > 0 ? `${faNum(detected)} ورودی شناسایی شد` : "—"}
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir="ltr"
          rows={12}
          spellCheck={false}
          placeholder={"vless://…\nvmess://…\ntrojan://…\nss://…\n\nیا محتوای base64 سابسکریپشن"}
          className="field resize-y font-mono text-left text-[11px] leading-5"
        />

        <button
          onClick={run}
          disabled={busy || !text.trim()}
          className={cn(
            "mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-cyan-400 to-violet-500 px-6 py-3.5 text-sm font-black text-zinc-950 transition disabled:cursor-not-allowed disabled:opacity-50",
            !busy && text.trim() && "hover:brightness-110 active:scale-[0.99]"
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" strokeWidth={2.5} />}
          {busy ? "در حال پردازش…" : "وارد کردن به مخزن"}
        </button>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-rose-400/10 px-4 py-2.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-400/25">
            <XCircle className="size-4 shrink-0" />
            {error}
          </p>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
            >
              <ResultBox label="پارس شده" value={faNum(result.parsed)} tone="text-zinc-200" />
              <ResultBox label="ذخیره جدید" value={faNum(result.inserted)} tone="text-emerald-300" icon={<CheckCircle2 className="size-3.5" />} />
              <ResultBox label="تکراری" value={faNum(result.duplicates)} tone="text-amber-300" />
              <ResultBox label="نامعتبر" value={faNum(result.failed)} tone="text-rose-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultBox({ label, value, tone, icon }: { label: string; value: string; tone: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
      <p className={cn("num flex items-center justify-center gap-1 text-xl font-black", tone)}>
        {icon}
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-zinc-500">{label}</p>
    </div>
  );
}
