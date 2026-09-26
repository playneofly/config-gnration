"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, X } from "lucide-react";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* ---------- کارت ---------- */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("glass rounded-3xl", className)}>{children}</div>
  );
}

export function PageHeader({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="mb-7 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {desc && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
            {desc}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  );
}

/* ---------- فرم ---------- */

export function Field({
  label,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
        {label}
        {optional && (
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
            اختیاری
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "field-surface w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none",
        props.className
      )}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "field-surface w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none",
        props.className
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "field-surface w-full appearance-none rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none [&>option]:bg-[#0b0d17]",
        props.className
      )}
    />
  );
}

/* ---------- دکمه‌ها ---------- */

type BtnVariant = "primary" | "ghost" | "danger" | "soft";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
}

const btnStyles: Record<BtnVariant, string> = {
  primary:
    "bg-gradient-to-l from-violet-500 to-indigo-500 text-white shadow-[0_8px_26px_rgba(124,108,255,0.35)] hover:brightness-110 active:scale-[0.98]",
  ghost:
    "bg-white/[0.04] text-slate-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-white",
  soft: "bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/25 hover:bg-cyan-400/15",
  danger:
    "bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/25 hover:bg-rose-500/20",
};

export function Button({ variant = "primary", className, ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        btnStyles[variant],
        className
      )}
    />
  );
}

/* ---------- دکمه کپی ---------- */

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({
  text,
  label,
  className,
  onCopied,
}: {
  text: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setOk(true);
          onCopied?.();
          setTimeout(() => setOk(false), 1600);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all",
        ok
          ? "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-white/[0.05] text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {label && <span>{ok ? "کپی شد" : label}</span>}
    </button>
  );
}

/* ---------- سگمنت ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "field-surface flex flex-wrap gap-1 rounded-xl p-1",
        className
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "relative flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
            value === o.value ? "text-white" : "text-slate-400 hover:text-slate-200"
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={undefined}
              className="absolute inset-0 rounded-lg bg-gradient-to-l from-violet-500/80 to-indigo-500/80 shadow"
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- تاگل ---------- */

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-gradient-to-l from-emerald-400 to-teal-500" : "bg-slate-700"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow",
          checked ? "-left-0.5" : "left-[calc(100%-1.375rem)]"
        )}
      />
    </button>
  );
}

/* ---------- مودال ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "glass max-h-[88dvh] w-full overflow-y-auto rounded-3xl p-5 shadow-2xl sm:p-6",
              wide ? "max-w-3xl" : "max-w-md"
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-white">{title}</h3>
              <button
                onClick={onClose}
                className="grid size-8 place-items-center rounded-lg bg-white/5 text-slate-400 ring-1 ring-white/10 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- حالت خالی ---------- */

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center rounded-3xl px-6 py-16 text-center"
    >
      <div className="grid size-16 place-items-center rounded-2xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-white">{title}</h3>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-slate-400">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

/* ---------- لودینگ ---------- */

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        className="size-9 rounded-full border-2 border-violet-400/20 border-t-violet-400"
      />
      {label && <p className="text-xs text-slate-500">{label}</p>}
    </div>
  );
}

/* ---------- لینک مونو LTR ---------- */

export function MonoBox({ text, className }: { text: string; className?: string }) {
  return (
    <div
      dir="ltr"
      className={cn(
        "field-surface overflow-x-auto rounded-xl px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-cyan-200/90",
        className
      )}
      style={{ unicodeBidi: "plaintext", textAlign: "left" }}
    >
      <span className="whitespace-nowrap">{text}</span>
    </div>
  );
}

export function ProBadge({ protocol }: { protocol: string }) {
  const map: Record<string, string> = {
    vless: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/30",
    vmess: "bg-violet-400/10 text-violet-300 ring-violet-400/30",
    trojan: "bg-rose-400/10 text-rose-300 ring-rose-400/30",
    shadowsocks: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
    wireguard: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  };
  const label =
    protocol === "shadowsocks" ? "SS" : protocol.toUpperCase();
  return (
    <span
      className={cn(
        "rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-wider ring-1",
        map[protocol] ?? "bg-white/10 text-slate-300 ring-white/20"
      )}
    >
      {label}
    </span>
  );
}
