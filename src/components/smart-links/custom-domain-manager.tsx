"use client";

import { useState } from "react";
import { Check, Clipboard, ExternalLink, Globe2, Loader2, Plus, Power, RefreshCw, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { CustomDomainDnsRecord, CustomDomainView } from "@/types/custom-domain";

export default function CustomDomainManager({
  smartLinkId,
  initialDomains,
}: {
  smartLinkId: string;
  initialDomains: CustomDomainView[];
}) {
  const [domains, setDomains] = useState<CustomDomainView[]>(initialDomains);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [pendingRemoveDomain, setPendingRemoveDomain] = useState<string | null>(null);
  const { pushToast } = useToast();

  async function addDomain() {
    if (!input.trim()) return;
    setBusy("add");
    setError("");
    try {
      const response = await fetch("/api/custom-domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ smartLinkId, domain: input }),
      });
      const payload = await response.json().catch(() => null) as { domain?: CustomDomainView; error?: string } | null;
      if (!response.ok || !payload?.domain) throw new Error(payload?.error ?? "Could not add domain.");
      setDomains((current) => [...current, payload.domain!]);
      setInput("");
      pushToast({ title: "Domain added", description: "Add the DNS records, then verify ownership.", tone: "success" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add domain.");
    } finally {
      setBusy("");
    }
  }

  async function action(domain: string, operation: "VERIFY" | "ACTIVATE" | "DISABLE") {
    setBusy(`${operation}:${domain}`);
    setError("");
    try {
      const response = await fetch("/api/custom-domains", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ smartLinkId, domain, action: operation }),
      });
      const payload = await response.json().catch(() => null) as { domain?: CustomDomainView; error?: string } | null;
      if (!response.ok || !payload?.domain) throw new Error(payload?.error ?? "Domain update failed.");
      setDomains((current) => current.map((item) => item.domain === domain ? payload.domain! : item));
      pushToast({ title: operation === "VERIFY" ? "DNS checked" : operation === "ACTIVATE" ? "Domain activated" : "Domain disabled", tone: "success" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Domain update failed.");
    } finally {
      setBusy("");
    }
  }

  async function remove(domain: string) {
    setBusy(`DELETE:${domain}`);
    setError("");
    try {
      const response = await fetch("/api/custom-domains", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ smartLinkId, domain }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? "Could not remove domain.");
      }
      setDomains((current) => current.filter((item) => item.domain !== domain));
      setPendingRemoveDomain(null);
      pushToast({ title: "Domain removed", tone: "success" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not remove domain.");
    } finally {
      setBusy("");
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1200);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"><Globe2 size={18} /></div>
        <div className="min-w-0">
          <p className="text-sm font-black text-zinc-950">Custom domains</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">Connect a domain you own directly to this link.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void addDomain(); }}
          placeholder="links.example.com"
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
        />
        <button
          type="button"
          onClick={() => void addDomain()}
          disabled={busy === "add" || !input.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          {busy === "add" ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add domain
        </button>
      </div>

      {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
      {domains.length === 0 && <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs leading-5 text-zinc-500">No custom domain connected to this link.</p>}

      <div className="mt-4 space-y-3">
        {domains.map((item) => (
          <div key={item.id} className="rounded-xl bg-zinc-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-all text-sm font-black text-zinc-950">{item.domain}</p>
                  <DomainStatus status={item.status} />
                </div>
                {item.status === "ACTIVE" && (
                  <a href={`https://${item.domain}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-zinc-600 hover:text-zinc-950">
                    Open domain <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPendingRemoveDomain(item.domain)}
                disabled={busy.endsWith(item.domain)}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-600 disabled:opacity-40"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <DnsCard title="1. Verify ownership" record={item.dns.verification} copied={copied} onCopy={copy} />
              <DnsCard title="2. Route traffic" record={item.dns.routing} copied={copied} onCopy={copy} routing />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {!item.verifiedAt && <DomainAction icon={RefreshCw} label="Check DNS" busy={busy === `VERIFY:${item.domain}`} onClick={() => action(item.domain, "VERIFY")} />}
              {item.verifiedAt && item.status !== "ACTIVE" && <DomainAction icon={Power} label="Activate" busy={busy === `ACTIVATE:${item.domain}`} onClick={() => action(item.domain, "ACTIVATE")} />}
              {item.status === "ACTIVE" && <DomainAction icon={Power} label="Disable" busy={busy === `DISABLE:${item.domain}`} onClick={() => action(item.domain, "DISABLE")} />}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingRemoveDomain)}
        title="Remove custom domain?"
        description={pendingRemoveDomain ? `${pendingRemoveDomain} will stop routing to this Link. DNS records at your provider are not changed.` : "This custom domain will be removed."}
        confirmLabel="Remove domain"
        destructive
        busy={Boolean(pendingRemoveDomain && busy === `DELETE:${pendingRemoveDomain}`)}
        onClose={() => setPendingRemoveDomain(null)}
        onConfirm={async () => {
          if (!pendingRemoveDomain) return;
          await remove(pendingRemoveDomain);
        }}
      />
    </div>
  );
}

function DnsCard({ title, record, copied, onCopy, routing = false }: { title: string; record: CustomDomainDnsRecord; copied: string; onCopy: (value: string) => Promise<void>; routing?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-xs font-black text-zinc-800">{title}</p>
      {routing && <p className="mt-1 text-[11px] leading-4 text-zinc-400">For apex domains, use your DNS provider&apos;s ALIAS/ANAME or CNAME-flattening equivalent.</p>}
      <DnsRow label="Type" value={record.type} copied={copied} onCopy={onCopy} />
      <DnsRow label="Name" value={record.name} copied={copied} onCopy={onCopy} />
      <DnsRow label="Value" value={record.value} copied={copied} onCopy={onCopy} />
    </div>
  );
}

function DnsRow({ label, value, copied, onCopy }: { label: string; value: string; copied: string; onCopy: (value: string) => Promise<void> }) {
  return (
    <div className="mt-2 grid min-w-0 grid-cols-[42px_minmax(0,1fr)_30px] items-center gap-2">
      <span className="text-[10px] font-bold uppercase text-zinc-400">{label}</span>
      <code className="min-w-0 break-all rounded-lg bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-700">{value}</code>
      <button type="button" onClick={() => void onCopy(value)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200" aria-label={`Copy ${label}`}>
        {copied === value ? <Check size={12} /> : <Clipboard size={12} />}
      </button>
    </div>
  );
}

function DomainStatus({ status }: { status: CustomDomainView["status"] }) {
  const style = status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : status === "VERIFIED" ? "bg-blue-100 text-blue-700" : status === "DISABLED" ? "bg-zinc-200 text-zinc-600" : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${style}`}>{status}</span>;
}

function DomainAction({ icon: Icon, label, busy, onClick }: { icon: typeof Power; label: string; busy: boolean; onClick: () => Promise<unknown> }) {
  return (
    <button type="button" onClick={() => void onClick()} disabled={busy} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 disabled:opacity-40">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />} {label}
    </button>
  );
}
