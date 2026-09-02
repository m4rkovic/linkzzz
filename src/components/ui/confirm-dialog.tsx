"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const dialogRef = useDialogFocus<HTMLDivElement>({ open, onClose, closeOnEscape: !busy, initialFocusRef: cancelRef });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={() => !busy && onClose()}
        aria-label="Close confirmation"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${destructive ? "bg-red-50 text-red-700" : "bg-brand-violet-soft text-brand-violet-strong"}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-black tracking-tight text-zinc-950">{title}</h2>
            <p id="confirm-dialog-description" className="mt-1.5 text-sm leading-6 text-zinc-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close confirmation"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={() => void onConfirm()}
            disabled={busy}
            className={destructive ? "border-red-200 bg-red-600 text-white hover:bg-red-700" : undefined}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
