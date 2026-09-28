"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Import,
  Layers,
  LayoutDashboard,
  Radio,
  Share2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "داشبورد", icon: LayoutDashboard },
  { href: "/generate", label: "ساخت تکی", icon: Zap },
  { href: "/bulk", label: "ساخت دسته‌ای", icon: Layers },
  { href: "/configs", label: "کانفیگ‌ها", icon: Gauge },
  { href: "/subs", label: "اشتراک‌ها", icon: Share2 },
  { href: "/import", label: "وارد کردن", icon: Import },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* دسکتاپ: سایدبار کناری */}
      <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col gap-2 border-l border-white/[0.06] px-4 py-8 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-[0_0_28px_rgba(34,211,238,0.4)]">
            <Radio className="size-5 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold text-white">ویتوری‌ساز</span>
            <span className="block text-[11px] text-zinc-500">کانفیگ واقعی، تست‌شده</span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                isActive(href)
                  ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] transition-colors",
                  isActive(href) ? "text-cyan-300" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {label}
              {isActive(href) && (
                <span className="mr-auto size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="glass rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-zinc-300">تفاوت با نسخه قبلی</p>
          <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
            کانفیگ‌ها از منابع زنده جمع‌آوری و با اتصال واقعی TCP تست می‌شوند؛ دیگر هیچ کانفیگ الکی ساخته نمی‌شود.
          </p>
        </div>
      </aside>

      {/* موبایل: ناوبری پایین */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 gap-1 rounded-2xl border border-white/10 bg-[#10101a]/90 p-1.5 shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors",
              isActive(href) ? "bg-white/[0.08] text-cyan-300" : "text-zinc-500"
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
