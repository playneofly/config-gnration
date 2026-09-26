"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Dices, QrCode, Wand2 } from "lucide-react";
import { useState } from "react";
import { generateAutoConfig } from "@/lib/auto";
import type { ConfigWithShare, Protocol } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "./providers";
import QrModal from "./qr-modal";
import { Button, CopyButton, MonoBox, ProBadge } from "./primitives";

type Choice = "random" | Protocol;

const CHOICES: { value: Choice; label: string }[] = [
  { value: "random", label: "تصادفی" },
  { value: "vless", label: "VLESS" },
  { value: "vmess", label: "VMess" },
  { value: "trojan", label: "Trojan" },
  { value: "shadowsocks", label: "SS" },
  { value: "wireguard", label: "WARP" },
];

/** ساخت کانفیگ کاملاً خودکار با یک کلیک — سرور، پورت، SNI، Path و نام همگی تصادفی */
export default function QuickAutoCreate() {
  const { push } = useToast();
  const [choice, setChoice] = useState<Choice>("random");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ConfigWithShare | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const draft = generateAutoConfig(choice);
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      setResult(data.item);
      push("کانفیگ خودکار ساخته شد");
    } catch (e) {
      push(e instanceof Error ? e.message : "خطا در ساخت کانفیگ", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-5 sm:p-6">
      <div className="pointer-events-none absolute -top-24 left-1/4 size-56 rounded-full bg-cyan-500/15 blur-[90px]" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-lg">
              <Wand2 className="size-4.5 text-white" />
            </span>
            ساخت خودکار — فقط دکمه را بزنید
          </h2>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-400/25">
            سرور + پورت + SNI + Path: اتوماتیک
          </span>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
          آدرس سرور از IPهای تمیز کلادفلر، پورت از پورت‌های TLS، SNI از
          دامنه‌های معتبر و Path به‌صورت تصادفی ساخته می‌شود. شما فقط پروتکل را
          انتخاب کنید (یا بگذارید روی تصادفی).
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {CHOICES.map((c) => (
            <button
              key={c.value}
              onClick={() => setChoice(c.value)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-bold transition-all",
                choice === c.value
                  ? "bg-gradient-to-l from-cyan-500 to-violet-500 text-white shadow-lg"
                  : "bg-white/[0.04] text-slate-400 ring-1 ring-white/10 hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <Button
          onClick={generate}
          disabled={busy}
          className="mt-4 w-full bg-gradient-to-l from-cyan-500 via-violet-500 to-fuchsia-500 py-3 text-base shadow-[0_10px_36px_rgba(34,211,238,0.3)]"
        >
          <Dices className={cn("size-5", busy && "animate-spin")} />
          {busy ? "در حال تولید…" : "ساخت خودکار کانفیگ"}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 14, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4.5 shrink-0 text-emerald-400" />
                  <ProBadge protocol={result.protocol} />
                  <p className="min-w-0 flex-1 truncate text-sm font-extrabold text-white">
                    {result.name}
                  </p>
                  <span dir="ltr" className="font-mono text-[10px] text-slate-500">
                    {result.host}:{result.port}
                  </span>
                </div>
                <MonoBox
                  text={result.share}
                  className="mt-3 max-h-24 whitespace-normal break-all"
                />
                <div className="mt-3 flex gap-2">
                  <CopyButton text={result.share} label="کپی لینک" className="flex-1 py-2.5" />
                  <Button variant="ghost" className="flex-1" onClick={() => setQrOpen(true)}>
                    <QrCode className="size-4" />
                    QR
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={generate} disabled={busy}>
                    <Dices className="size-4" />
                    یکی دیگر
                  </Button>
                </div>
                <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                  این کانفیگ در فهرست کانفیگ‌ها و در اشتراک‌های «همه کانفیگ‌ها»
                  قرار گرفت. برای تغییر دستی جزئیات، آن را ویرایش کنید.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QrModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        text={result?.share ?? ""}
        title={result?.name ?? "کانفیگ"}
      />
    </div>
  );
}
