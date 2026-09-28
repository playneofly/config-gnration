"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, QrCode, X } from "lucide-react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { PROTOCOL_META } from "@/lib/constants";
import type { Protocol } from "@/lib/types";

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function ProtocolBadge({ protocol }: { protocol: string }) {
  const meta = PROTOCOL_META[(protocol as Protocol) in PROTOCOL_META ? (protocol as Protocol) : "other"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
        meta.badge
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

export function CopyButton({
  text,
  label = "کپی",
  className,
  small,
}: {
  text: string;
  label?: string;
  className?: string;
  small?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold transition-all",
        small ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm",
        copied
          ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-white/[0.06] text-zinc-200 ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-white",
        className
      )}
    >
      {copied ? <Check className={small ? "size-3.5" : "size-4"} /> : <Copy className={small ? "size-3.5" : "size-4"} />}
      {copied ? "کپی شد" : label}
    </button>
  );
}

export function QrModal({ text, title, open, onClose }: { text: string; title: string; open: boolean; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    if (!open || !text) return;
    QRCode.toDataURL(text, { width: 420, margin: 2, color: { dark: "#0b0b12", light: "#ffffff" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [open, text]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-sm rounded-3xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="truncate text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="بستن"
          >
            <X className="size-4" />
          </button>
        </div>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR Code" className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-3" />
        ) : (
          <div className="mx-auto grid h-[280px] max-w-[280px] place-items-center text-zinc-500">در حال ساخت QR…</div>
        )}
        <p className="mt-4 text-[11px] text-zinc-500">با کلاینت V2Ray (مثل v2rayNG) اسکن کنید</p>
      </div>
    </div>
  );
}

export function QrButton({ text, title, small }: { text: string; title: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-white/[0.06] font-semibold text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1] hover:text-white",
          small ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm"
        )}
      >
        <QrCode className={small ? "size-3.5" : "size-4"} />
        QR
      </button>
      <QrModal text={text} title={title} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function StatusPill({ alive, latency }: { alive: boolean | null; latency: number | null }) {
  if (alive === true)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/25">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        سالم{latency !== null && <span className="num font-medium text-emerald-400/70">{latency}ms</span>}
      </span>
    );
  if (alive === false)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-2.5 py-1 text-[11px] font-bold text-rose-300 ring-1 ring-rose-400/25">
        <span className="size-1.5 rounded-full bg-rose-400" />
        قطع
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-400/10 px-2.5 py-1 text-[11px] font-bold text-zinc-400 ring-1 ring-zinc-400/20">
      <span className="size-1.5 rounded-full bg-zinc-500" />
      تست‌نشده
    </span>
  );
}
