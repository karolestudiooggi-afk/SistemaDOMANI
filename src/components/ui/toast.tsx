"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}

interface ToastCtx {
  toast: (kind: ToastKind, title: string, desc?: string) => void;
  success: (title: string, desc?: string) => void;
  error: (title: string, desc?: string) => void;
  info: (title: string, desc?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast fora do ToastProvider");
  return ctx;
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-ember" />,
  error: <XCircle className="h-5 w-5 text-red-400" />,
  info: <Info className="h-5 w-5 text-content-soft" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, title: string, desc?: string) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, kind, title, desc }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const api: ToastCtx = {
    toast,
    success: (t, d) => toast("success", t, d),
    error: (t, d) => toast("error", t, d),
    info: (t, d) => toast("info", t, d),
  };

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] sm:w-96">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-in-right flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4 shadow-2xl backdrop-blur"
          >
            <div className="mt-0.5 shrink-0">{icons[t.kind]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-content">{t.title}</p>
              {t.desc && <p className="mt-0.5 text-[13px] text-content-soft">{t.desc}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 text-content-mute hover:text-content transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
