"use client";

import Link from "next/link";
import { ExternalLink, Link2, ShieldOff, ShieldCheck } from "lucide-react";
import { useState } from "react";

import AdminConfirmDialog from "@/components/admin/ui/admin-confirm-dialog";
import type { AdminSmartLinkModel } from "@/features/admin/admin-types";
import { formatUtcDate } from "@/lib/date-format";

export default function UserSmartLinksCard({
  smartLinks,
  canRestore,
  onSetStatus,
}: {
  smartLinks: AdminSmartLinkModel[];
  canRestore: boolean;
  onSetStatus: (smartLinkId: string, status: "PUBLISHED" | "DISABLED") => Promise<unknown>;
}) {
  const [pending, setPending] = useState<AdminSmartLinkModel | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = [...smartLinks].sort((a, b) => {
    const rank = { PUBLISHED: 0, DISABLED: 1, DRAFT: 2 } as const;
    return rank[a.status] - rank[b.status] || b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      await onSetStatus(
        pending.id,
        pending.status === "PUBLISHED" ? "DISABLED" : "PUBLISHED",
      );
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
          <Link2 size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-950">Customer Smart Links</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Inspect public visibility without changing the customer&apos;s saved destinations or design.
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
          This customer has no Smart Links yet.
        </div>
      ) : (
        <div className="mt-5 divide-y divide-zinc-100 rounded-2xl border border-zinc-200">
          {sorted.map((smartLink) => {
            const published = smartLink.status === "PUBLISHED";
            const disabled = smartLink.status === "DISABLED";
            return (
              <div key={smartLink.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-zinc-950">{smartLink.title}</p>
                    <StatusBadge status={smartLink.status} />
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
                      {smartLink.type === "LANDING_PAGE" ? "Landing Page" : "Direct"}
                    </span>
                  </div>
                  <p className="mt-1 break-all text-xs text-zinc-500">/{smartLink.slug}</p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Updated {formatUtcDate(smartLink.updatedAt, { month: "short", day: "2-digit", year: "numeric" })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                  {published ? (
                    <Link
                      href={`/${smartLink.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <ExternalLink size={14} /> Open
                    </Link>
                  ) : null}

                  {published ? (
                    <button
                      type="button"
                      onClick={() => setPending(smartLink)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      <ShieldOff size={14} /> Disable public access
                    </button>
                  ) : disabled ? (
                    <button
                      type="button"
                      onClick={() => setPending(smartLink)}
                      disabled={!canRestore}
                      title={!canRestore ? "Restore the account and subscription first." : undefined}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ShieldCheck size={14} /> Restore public access
                    </button>
                  ) : (
                    <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-50 px-3 text-xs font-medium text-zinc-400">
                      Draft is already private
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(pending)}
        title={pending?.status === "PUBLISHED" ? "Disable this Smart Link?" : "Restore this Smart Link?"}
        description={pending?.status === "PUBLISHED"
          ? "Public access to this Smart Link will stop immediately. Its content, analytics, assets and configuration stay intact."
          : "The Smart Link will become publicly available again using its existing saved configuration."}
        confirmLabel={busy ? "Applying…" : pending?.status === "PUBLISHED" ? "Disable Smart Link" : "Restore Smart Link"}
        danger={pending?.status === "PUBLISHED"}
        onCancel={() => { if (!busy) setPending(null); }}
        onConfirm={() => { if (!busy) void confirm(); }}
      />
    </section>
  );
}

function StatusBadge({ status }: { status: AdminSmartLinkModel["status"] }) {
  const classes = status === "PUBLISHED"
    ? "bg-brand-lime-soft text-zinc-900"
    : status === "DISABLED"
      ? "bg-red-50 text-red-700"
      : "bg-brand-violet-soft text-brand-violet-strong";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${classes}`}>
      {status === "PUBLISHED" ? "Published" : status === "DISABLED" ? "Disabled" : "Draft"}
    </span>
  );
}
