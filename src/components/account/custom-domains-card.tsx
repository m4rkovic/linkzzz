"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clipboard, Globe2, Loader2, Plus, Power, RefreshCw, Trash2 } from "lucide-react";

type DomainRecord = {
  id: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "DISABLED";
  verifiedAt: string | null;
  dns: { type: "TXT"; name: string; value: string };
};

export default function CustomDomainsCard() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/custom-domains", { cache: "no-store" });
    const payload = await response.json().catch(() => null) as { domains?: DomainRecord[]; error?: string } | null;
    if (!response.ok) throw new Error(payload?.error ?? "Could not load custom domains.");
    setDomains(payload?.domains ?? []);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load custom domains.")).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function addDomain() {
    if (!input.trim()) return;
    setBusy("add"); setError("");
    try {
      const response = await fetch("/api/custom-domains", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain: input }) });
      const payload = await response.json().catch(() => null) as { domain?: DomainRecord; error?: string } | null;
      if (!response.ok || !payload?.domain) throw new Error(payload?.error ?? "Could not add domain.");
      setDomains((current) => [...current, payload.domain!]);
      setInput("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add domain."); }
    finally { setBusy(""); }
  }

  async function action(domain: string, operation: "VERIFY" | "ACTIVATE" | "DISABLE") {
    setBusy(`${operation}:${domain}`); setError("");
    try {
      const response = await fetch("/api/custom-domains", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain, action: operation }) });
      const payload = await response.json().catch(() => null) as { domain?: DomainRecord; error?: string } | null;
      if (!response.ok || !payload?.domain) throw new Error(payload?.error ?? "Domain update failed.");
      setDomains((current) => current.map((item) => item.domain === domain ? payload.domain! : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Domain update failed."); }
    finally { setBusy(""); }
  }

  async function remove(domain: string) {
    if (!window.confirm(`Remove ${domain} from this profile?`)) return;
    setBusy(`DELETE:${domain}`); setError("");
    try {
      const response = await fetch("/api/custom-domains", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain }) });
      if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error ?? "Could not remove domain."); }
      setDomains((current) => current.filter((item) => item.domain !== domain));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not remove domain."); }
    finally { setBusy(""); }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1200);
  }

  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"><Globe2 size={19} /></div>
        <div><h2 className="text-lg font-semibold text-zinc-950">Custom domains</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Connect a domain you own and verify it through DNS.</p></div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addDomain(); }} placeholder="links.example.com" className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-400" />
        <button type="button" onClick={() => void addDomain()} disabled={busy === "add" || !input.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy === "add" ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Add domain</button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {loading && <p className="text-sm text-zinc-500">Loading domains…</p>}
        {!loading && domains.length === 0 && <div className="rounded-xl border border-dashed border-zinc-200 p-5 text-sm text-zinc-500">No custom domain connected yet.</div>}
        {domains.map((item) => (
          <div key={item.id} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-all text-sm font-semibold text-zinc-950">{item.domain}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : item.status === "VERIFIED" ? "bg-blue-50 text-blue-700" : item.status === "DISABLED" ? "bg-zinc-100 text-zinc-600" : "bg-amber-50 text-amber-700"}`}>{item.status}</span></div><button type="button" onClick={() => void remove(item.domain)} disabled={busy.endsWith(item.domain)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-600"><Trash2 size={14} />Remove</button></div>
            {!item.verifiedAt && <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600"><p className="font-semibold text-zinc-800">Add this DNS record</p><DnsRow label="Type" value={item.dns.type} copied={copied} onCopy={copy} /><DnsRow label="Name" value={item.dns.name} copied={copied} onCopy={copy} /><DnsRow label="Value" value={item.dns.value} copied={copied} onCopy={copy} /></div>}
            <div className="mt-4 flex flex-wrap gap-2">
              {!item.verifiedAt && <ActionButton icon={RefreshCw} label="Check DNS" busy={busy === `VERIFY:${item.domain}`} onClick={() => action(item.domain, "VERIFY")} />}
              {item.verifiedAt && item.status !== "ACTIVE" && <ActionButton icon={Power} label="Activate" busy={busy === `ACTIVATE:${item.domain}`} onClick={() => action(item.domain, "ACTIVATE")} />}
              {item.status === "ACTIVE" && <ActionButton icon={Power} label="Disable" busy={busy === `DISABLE:${item.domain}`} onClick={() => action(item.domain, "DISABLE")} />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DnsRow({ label, value, copied, onCopy }: { label: string; value: string; copied: string; onCopy: (value: string) => Promise<void> }) {
  return <div className="mt-2 grid min-w-0 grid-cols-[48px_minmax(0,1fr)_32px] items-center gap-2"><span className="text-zinc-400">{label}</span><code className="min-w-0 break-all rounded bg-white px-2 py-1.5 text-[11px] text-zinc-700">{value}</code><button type="button" onClick={() => void onCopy(value)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white" aria-label={`Copy ${label}`}>{copied === value ? <Check size={13} /> : <Clipboard size={13} />}</button></div>;
}

function ActionButton({ icon: Icon, label, busy, onClick }: { icon: typeof Power; label: string; busy: boolean; onClick: () => Promise<unknown> }) {
  return <button type="button" onClick={() => void onClick()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 disabled:opacity-50">{busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}{label}</button>;
}
