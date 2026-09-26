"use client";

import { motion } from "framer-motion";
import {
  Boxes,
  Download,
  LayoutDashboard,
  PlusCircle,
  Rss,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/configs", label: "کانفیگ‌ها", icon: Boxes },
  { href: "/configs/new", label: "ساخت کانفیگ", icon: PlusCircle },
  { href: "/bulk", label: "ساخت انبوه", icon: Zap },
  { href: "/subs", label: "لینک اشتراک", icon: Rss },
  { href: "/import", label: "وارد کردن", icon: Download },
];

function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="animate-pulse-ring relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_8px_30px_rgba(139,124,255,0.4)]">
        <svg viewBox="0 0 24 24" className="size-6 text-white" fill="currentColor">
          <path d="M13 2 4.9 12.8c-.3.4 0 1 .5 1H11l-1 8 8.4-11c.3-.4 0-1-.5-1H12l1-7.8Z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-base font-extrabold tracking-tight text-white">
          پنل نئون
        </span>
        <span className="block text-[11px] font-medium text-slate-400">
          سازنده نامحدود کانفیگ
        </span>
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 right-0 z-40 hidden w-72 flex-col border-l border-white/[0.06] bg-[#070912]/80 px-5 py-7 backdrop-blur-2xl lg:flex">
      <Logo />
      <nav className="mt-10 flex flex-1 flex-col gap-1.5">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : item.href === "/configs"
                ? pathname === "/configs"
                : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                active ? "text-white" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-l from-violet-500/20 to-cyan-400/10 ring-1 ring-violet-400/25"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon
                className={`relative size-[18px] transition-colors ${
                  active ? "text-violet-300" : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="glass-soft rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-slate-300">
          خروجی‌های پشتیبانی‌شده
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {["v2ray", "sing-box", "Clash", "QR"].map((f) => (
            <span
              key={f}
              className="rounded-lg bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-white/10"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05060b]/85 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Logo />
      </div>
      <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-violet-500/20 text-white ring-1 ring-violet-400/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
