"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{ push: (m: string, t?: ToastType) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export default function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, type: ToastType = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={`glass pointer-events-auto flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm shadow-2xl ${
                t.type === "error"
                  ? "border-rose-400/30 text-rose-200"
                  : "border-emerald-400/25 text-emerald-100"
              }`}
            >
              {t.type === "error" ? (
                <AlertTriangle className="size-4.5 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="size-4.5 shrink-0 text-emerald-400" />
              )}
              <span className="leading-relaxed">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
