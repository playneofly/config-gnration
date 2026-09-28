import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import BackgroundFx from "@/components/background-fx";
import "./globals.css";

export const metadata: Metadata = {
  title: "ویتوری‌ساز | مولد کانفیگ واقعی V2Ray",
  description:
    "ساخت، جمع‌آوری و تست کانفیگ‌های واقعی VLESS، VMess، Trojan و Shadowsocks از منابع زنده با خروجی سابسکریپشن",
};

export const viewport: Viewport = {
  themeColor: "#09090f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-dvh font-sans antialiased">
        <BackgroundFx />
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1500px]">
          <Sidebar />
          <main className="flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
