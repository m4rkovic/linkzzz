"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cx } from "@/lib/class-names";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastRecord = ToastInput & {
  id: string;
  tone: ToastTone;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const toast: ToastRecord = {
      ...input,
      id,
      tone: input.tone ?? "info",
    };

    setToasts((current) => [...current.slice(-3), toast]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((candidate) => candidate.id !== id));
    }, input.duration ?? 3200);

    return id;
  }, []);

  const value = useMemo(() => ({ pushToast, dismissToast }), [dismissToast, pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:w-[min(92vw,380px)]"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: ToastRecord; onDismiss: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? XCircle : Info;

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cx(
        "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-[0_18px_50px_rgba(24,24,27,0.18)]",
        toast.tone === "success" && "border-emerald-200",
        toast.tone === "error" && "border-red-200",
        toast.tone === "info" && "border-zinc-200",
      )}
    >
      <div
        className={cx(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
          toast.tone === "success" && "bg-emerald-50 text-emerald-700",
          toast.tone === "error" && "bg-red-50 text-red-700",
          toast.tone === "info" && "bg-brand-violet-soft text-brand-violet-strong",
        )}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-zinc-950">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs leading-5 text-zinc-500">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20"
      >
        <X size={15} />
      </button>
    </div>
  );
}
