import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/components/providers";
import Sidebar, { MobileNav } from "@/components/sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "پنل نئون | سازنده نامحدود کانفیگ",
  description:
    "ساخت و مدیریت نامحدود کانفیگ‌های VLESS، VMess، Trojan، Shadowsocks و WireGuard با لینک اشتراک یکپارچه",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap"
        />
      </head>
      <body className="font-sans bg-[#05060b] text-slate-200 antialiased">
        {/* پس‌زمینه محیطی */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="bg-grid absolute inset-0" />
          <div className="animate-floaty absolute -top-44 right-[8%] size-[36rem] rounded-full bg-violet-600/20 blur-[150px]" />
          <div className="absolute -bottom-40 left-[4%] size-[32rem] rounded-full bg-cyan-500/[0.13] blur-[140px]" />
          <div className="absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 rounded-full bg-fuchsia-600/[0.08] blur-[130px]" />
        </div>

        <Providers>
          <div className="relative z-10 flex min-h-dvh">
            <Sidebar />
            <div className="min-w-0 flex-1 lg:mr-72">
              <MobileNav />
              <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pt-10">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
