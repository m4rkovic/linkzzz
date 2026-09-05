"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Globe2, Trash2 } from "lucide-react";

import AdminConfirmDialog from "@/components/admin/ui/admin-confirm-dialog";
import type { AdminCustomDomainView } from "@/types/custom-domain";

export default function AdminCustomDomains({
  initialDomains,
}: {
  initialDomains: AdminCustomDomainView[];
}) {
  const [domains, setDomains] = useState(initialDomains);
  const [pending, setPending] = useState<AdminCustomDomainView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function release() {
    if (!pending) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/custom-domains/${pending.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Could not release domain.");
      }

      setDomains((current) => current.filter((domain) => domain.id !== pending.id));
      setPending(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not release domain.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Custom domains</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review ownership state and release stale or disputed domains.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {domains.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <Globe2 className="mx-auto text-zinc-300" size={24} />
          <p className="mt-3 text-sm font-semibold text-zinc-700">No custom domains connected.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="divide-y divide-zinc-100">
            {domains.map((domain) => (
              <div key={domain.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-all font-semibold text-zinc-950">{domain.domain}</p>
                    <DomainStatus domain={domain} />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    @{domain.ownerUsername} · {domain.smartLinkTitle}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/admin/users/${domain.ownerUserId}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700"
                  >
                    Owner
                  </Link>
                  <Link
                    href={`/${domain.smartLinkSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-xs font-semibold text-zinc-700"
                  >
                    Smart Link <ExternalLink size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPending(domain)}
                    disabled={busy}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    <Trash2 size={13} /> Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminConfirmDialog
        open={Boolean(pending)}
        title="Release custom domain?"
        description={pending ? `${pending.domain} will immediately stop routing and become available for another owner to claim.` : "The domain will be released."}
        confirmLabel={busy ? "Releasing…" : "Release domain"}
        danger
        onCancel={() => { if (!busy) setPending(null); }}
        onConfirm={() => { if (!busy) void release(); }}
      />
    </div>
  );
}

function DomainStatus({ domain }: { domain: AdminCustomDomainView }) {
  const label = domain.claimExpired
    ? "Claim expired"
    : domain.verificationRequired
      ? "Re-verification due"
      : domain.status.replaceAll("_", " ");

  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
      {label}
    </span>
  );
}
