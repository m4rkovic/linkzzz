"use client";

import { FormEvent, useState } from "react";
import { Link2, X } from "lucide-react";

import { normalizeSlug, validateSlug } from "@/features/admin/slug-validation";

export default function ChangeSlugModal({
  open,
  currentSlug,
  onClose,
  onSave,
}: {
  open: boolean;
  currentSlug: string;
  onClose: () => void;
  onSave: (slug: string) => void;
}) {
  const [value, setValue] = useState(currentSlug);
  const [error, setError] = useState("");

  if (!open) return null;

  function close() {
    setValue(currentSlug);
    setError("");
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSlug(value);
    const validationError = validateSlug(normalized);

    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(normalized);
    close();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="change-slug-title">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700"><Link2 size={18} /></div>
            <div>
              <h2 id="change-slug-title" className="text-lg font-semibold text-zinc-950">Change profile slug</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Update the public profile URL for this customer.</p>
            </div>
          </div>
          <button type="button" onClick={close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-800">Profile URL</span>
            <div className="mt-2 flex min-w-0 overflow-hidden rounded-xl border border-zinc-200 focus-within:border-zinc-400">
              <span className="flex shrink-0 items-center bg-zinc-50 px-3 text-sm text-zinc-500">linkzzz.com/</span>
              <input value={value} onChange={(event) => setValue(normalizeSlug(event.target.value))} className="h-11 min-w-0 flex-1 px-3 text-sm text-zinc-900 outline-none" />
            </div>
          </label>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <p className="text-xs leading-5 text-zinc-500">Allowed: lowercase letters, numbers, hyphen and underscore. Reserved application routes cannot be used.</p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className="min-h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700">Cancel</button>
            <button type="submit" className="min-h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white">Save slug</button>
          </div>
        </form>
      </div>
    </div>
  );
}
