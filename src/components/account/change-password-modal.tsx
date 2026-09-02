"use client";

import { FormEvent, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Check, Eye, EyeOff, KeyRound, X } from "lucide-react";

import { getPasswordRules, isStrongEnough } from "@/features/account/password-validation";
import { useDialogFocus } from "@/components/ui/use-dialog-focus";

type ChangePasswordResponse = {
  ok?: boolean;
  error?: string;
};

export default function ChangePasswordModal({
  open,
  onClose,
  forced = false,
}: {
  open: boolean;
  onClose?: () => void;
  forced?: boolean;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const rules = useMemo(() => getPasswordRules(newPassword), [newPassword]);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>({ open, onClose: forced ? undefined : resetAndClose, closeOnEscape: !forced && !loading, initialFocusRef: firstInputRef });

  if (!open) {
    return null;
  }

  function resetAndClose() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setShowPasswords(false);
    setLoading(false);
    onClose?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (!isStrongEnough(newPassword)) {
      setError("Your new password does not meet all requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must be different from the current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as ChangePasswordResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Unable to change password.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.location.replace("/login?passwordChanged=1");
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function goToLogin() {
    window.location.replace("/login");
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation">
      <div ref={dialogRef} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <KeyRound size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="change-password-title" className="text-lg font-semibold text-zinc-950">Change password</h2>
              <p className="mt-1 text-sm leading-5 text-zinc-500">Update the password used to access this account.</p>
            </div>
          </div>

          {!success && !forced && (
            <button type="button" onClick={resetAndClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100" aria-label="Close change password dialog">
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {success ? (
            <div className="rounded-2xl bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={17} /></div>
                <div>
                  <p className="font-semibold text-emerald-900">Password changed</p>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">All active sessions were revoked. Sign in again with your new password.</p>
                </div>
              </div>
              <button type="button" onClick={goToLogin} className="mt-5 min-h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white">Sign in again</button>
            </div>
          ) : (
            <>
              <PasswordInput inputRef={firstInputRef} label="Current password" value={currentPassword} onChange={setCurrentPassword} visible={showPasswords} autoComplete="current-password" />
              <PasswordInput label="New password" value={newPassword} onChange={setNewPassword} visible={showPasswords} autoComplete="new-password" />
              <PasswordInput label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} visible={showPasswords} autoComplete="new-password" />

              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Password requirements</p>
                <div className="mt-3 space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${rule.passed ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-400"}`}>
                        {rule.passed && <Check size={12} />}
                      </span>
                      <span className={rule.passed ? "text-zinc-800" : "text-zinc-500"}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p role="alert" data-testid="change-password-error" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-600">
                <input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
                Show passwords
              </label>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {!forced && <button type="button" onClick={resetAndClose} disabled={loading} className="min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 disabled:opacity-60">Cancel</button>}
                <button type={hydrated ? "submit" : "button"} disabled={!hydrated || loading} className="min-h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Changing..." : "Change password"}</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  autoComplete,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  autoComplete: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-800">{label}</span>
      <div className="relative mt-2">
        <input
          ref={inputRef}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-11 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </span>
      </div>
    </label>
  );
}
