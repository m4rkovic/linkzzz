"use client";

import { FormEvent, useState } from "react";
import { ShieldAlert, X } from "lucide-react";

export default function SuspendUserModal({
  open,
  onClose,
  onSuspend,
}: {
  open: boolean;
  onClose: () => void;
  onSuspend: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  function close() {
    setReason("");
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSuspend(reason.trim());
    close();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="suspend-user-title">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={18} /></div>
            <div>
              <h2 id="suspend-user-title" className="text-lg font-semibold text-zinc-950">Suspend account</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Block customer access without deleting their data.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Reason <span className="font-normal text-zinc-400">(optional)</span></span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Internal reason for suspension..." className="mt-2 w-full resize-none rounded-xl border border-zinc-200 p-3 text-sm text-zinc-900 outline-none focus:border-zinc-400" />
          </label>

          <div className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">The public profile will be disabled while the account is suspended. Profile data, links and analytics are preserved.</div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className="min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700">Cancel</button>
            <button type="submit" className="min-h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">Suspend account</button>
          </div>
        </form>
      </div>
    </div>
  );
}
