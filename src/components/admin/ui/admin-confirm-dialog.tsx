"use client";

import { AlertTriangle, X } from "lucide-react";

export default function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 id="admin-confirm-title" className="text-lg font-semibold text-zinc-950">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
            </div>
          </div>

          <button type="button" onClick={onCancel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100" aria-label="Close confirmation">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 p-5 sm:flex-row sm:justify-end sm:p-6">
          <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700">Cancel</button>
          <button type="button" onClick={onConfirm} className={`min-h-11 rounded-xl px-5 text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-zinc-950 hover:bg-zinc-800"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
