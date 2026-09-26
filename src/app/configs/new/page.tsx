"use client";

import { useRouter } from "next/navigation";
import ConfigForm from "@/components/config-form";
import { PageHeader } from "@/components/primitives";
import QuickAutoCreate from "@/components/quick-auto";

export default function NewConfigPage() {
  const router = useRouter();
  return (
    <div>
      <PageHeader
        title="ساخت کانفیگ جدید"
        desc="سریع‌ترین راه: دکمه ساخت خودکار را بزنید — سرور، پورت، SNI و Path خودشان ساخته می‌شوند. یا فرم دستی را کامل کنید."
      />
      <QuickAutoCreate />
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-extrabold text-slate-300">
          حالت دستی (پیشرفته)
        </h2>
        <ConfigForm onSaved={() => router.push("/configs")} />
      </div>
    </div>
  );
}
