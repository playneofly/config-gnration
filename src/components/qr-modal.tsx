"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button, CopyButton, Modal, MonoBox } from "./primitives";

export default function QrModal({
  open,
  onClose,
  text,
  title = "اسکن با کلاینت",
}: {
  open: boolean;
  onClose: () => void;
  text: string;
  title?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!open || !text) return;
    QRCode.toDataURL(text, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#e2e8f0", light: "#0b0d17" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [open, text]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-4">
        <div className="glass-soft rounded-2xl p-3">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="QR Code"
              className="size-64 rounded-xl"
              draggable={false}
            />
          ) : (
            <div className="grid size-64 animate-pulse place-items-center text-xs text-slate-500">
              در حال ساخت QR…
            </div>
          )}
        </div>
        <MonoBox text={text} className="max-h-24 w-full" />
        <div className="flex w-full gap-2">
          <CopyButton text={text} label="کپی لینک" className="flex-1 py-2.5" />
          {dataUrl && (
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                const a = document.createElement("a");
                a.href = dataUrl;
                a.download = "config-qr.png";
                a.click();
              }}
            >
              <Download className="size-4" />
              دانلود PNG
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
