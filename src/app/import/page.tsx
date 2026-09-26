"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ClipboardPaste, Download, FileSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/providers";
import {
  Button,
  Field,
  PageHeader,
  ProBadge,
  TextArea,
} from "@/components/primitives";
import { b64decode, parseShareLinks } from "@/lib/share";
import type { ConfigInput } from "@/lib/types";

export default function ImportPage() {
  const { push } = useToast();
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{
    configs: ConfigInput[];
    failed: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function analyze() {
    let input = text.trim();
    if (!input) return push("ابتدا لینک‌ها را وارد کنید", "error");
    // پشتیبانی از متن Base64 اشتراک
    if (!input.includes("://")) {
      try {
        const decoded = b64decode(input.replace(/\s/g, ""));
        if (decoded.includes("://")) input = decoded;
      } catch {
        /* ignore */
      }
    }
    const result = parseShareLinks(input);
    if (!result.configs.length && !result.failed.length)
      return push("هیچ لینکی پیدا نشد", "error");
    setParsed(result);
    setDone(false);
    if (!result.configs.length)
      push("هیچ‌کدام از لینک‌ها معتبر نبود", "error");
  }

  async function save() {
    if (!parsed?.configs.length) return;
    setSaving(true);
    try {
      const res = await fetch("/api/configs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsed.configs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا");
      push(`${Number(data.created).toLocaleString("fa-IR")} کانفیگ وارد شد`);
      setDone(true);
    } catch (e) {
      push(e instanceof Error ? e.message : "خطا در ذخیره", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="وارد کردن کانفیگ"
        desc="لینک‌های vless، vmess، trojan، ss یا wireguard را بچسبانید — حتی متن Base64 یک اشتراک هم پذیرفته می‌شود."
      />

      <div className="glass rounded-3xl p-5 sm:p-6">
        <Field label="لینک‌ها (در هر خط یک لینک)">
          <TextArea
            dir="ltr"
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"vless://uuid@host:443?security=tls&type=ws&path=%2F#name\nss://...\nvmess://..."}
            className="text-left font-mono text-xs leading-6"
          />
        </Field>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="soft" onClick={analyze}>
            <FileSearch className="size-4" />
            تحلیل لینک‌ها
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                const t = await navigator.clipboard.readText();
                setText(t);
                push("از کلیپ‌برد خوانده شد");
              } catch {
                push("دسترسی به کلیپ‌برد ممکن نیست", "error");
              }
            }}
          >
            <ClipboardPaste className="size-4" />
            چسباندن از کلیپ‌برد
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass mt-6 rounded-3xl p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-white">
                <span className="text-emerald-400">
                  {parsed.configs.length.toLocaleString("fa-IR")} لینک معتبر
                </span>
                {parsed.failed.length > 0 && (
                  <span className="text-rose-400">
                    {" "}
                    · {parsed.failed.length.toLocaleString("fa-IR")} نامعتبر
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                {done ? (
                  <Link href="/configs">
                    <Button variant="soft">
                      مشاهده فهرست کانفیگ‌ها
                      <ArrowLeft className="size-4" />
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={save} disabled={saving || !parsed.configs.length}>
                    <Download className="size-4" />
                    {saving ? "در حال ذخیره…" : "ذخیره همه"}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto pl-1">
              {parsed.configs.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.05]"
                >
                  <ProBadge protocol={c.protocol} />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-200">
                    {c.name}
                  </span>
                  <span dir="ltr" className="font-mono text-[10px] text-slate-500">
                    {c.host}:{c.port}
                  </span>
                </div>
              ))}
              {parsed.failed.map((f, i) => (
                <div
                  key={`f-${i}`}
                  dir="ltr"
                  className="truncate rounded-xl bg-rose-500/[0.06] px-3 py-2.5 text-left font-mono text-[10px] text-rose-300/80 ring-1 ring-rose-400/10"
                >
                  {f}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
