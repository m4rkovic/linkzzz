"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, X } from "lucide-react";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

export default function ResetPasswordModal({ open, onClose, onReset }: {
  open: boolean;
  onClose: () => void;
  onReset: () => Promise<string>;
}) {
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useDialogFocus<HTMLDivElement>({ open, onClose: close, closeOnEscape: !busy });
  if (!open) return null;

  async function generate() {
    setBusy(true); setError("");
    try { setPassword(await onReset()); setCopied(false); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Password reset failed."); }
    finally { setBusy(false); }
  }
  async function copy() { if (password) { await navigator.clipboard.writeText(password); setCopied(true); } }
  function close() { setPassword(""); setCopied(false); setError(""); onClose(); }

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    <div ref={dialogRef} className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100"><KeyRound size={18}/></div><div><h2 id="reset-password-title" className="text-lg font-semibold">Reset password</h2><p className="mt-1 text-sm text-zinc-500">Generate a server-side temporary password.</p></div></div>
        <button type="button" onClick={close} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-zinc-100"><X size={18}/></button>
      </div>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Reset invalidates the customer&apos;s sessions and requires a password change on next login.</div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {password ? <div><p className="text-sm font-semibold">Temporary password</p><div className="mt-2 flex items-center gap-2 rounded-xl border bg-zinc-50 p-2"><code className="min-w-0 flex-1 break-all px-2 text-sm font-semibold">{password}</code><button type="button" onClick={copy} className="flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold shadow-sm">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy"}</button></div></div> : <button type="button" disabled={busy} onClick={generate} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-50"><RefreshCw size={16}/> {busy ? "Resetting..." : "Reset password"}</button>}
        <div className="flex justify-end"><button type="button" onClick={close} className="min-h-11 rounded-xl border px-4 text-sm font-semibold">Close</button></div>
      </div>
    </div>
  </div>;
}
