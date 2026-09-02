"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { DestinationPicker } from "@/components/destinations/destination-picker";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { cardClassName } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-control";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import type { DestinationConfig } from "@/types/smart-link";
import { getPlanDefinition } from "@/features/plans/plan-catalog";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Files,
  Link2,
  MousePointerClick,
  Plus,
  Route,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

type SmartLinkListItem = {
  id: string;
  type: "LANDING_PAGE" | "DIRECT";
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "DISABLED";
  destinationUrl?: string;
  provider?: string;
  shieldEnabled: boolean;
  views: number;
  clicks: number;
  createdAt: string;
  revision: number;
  updatedAt: string;
};

type SmartLinksManagerProps = {
  initialLinks: SmartLinkListItem[];
  plan: "BASIC" | "PRO" | "ENTERPRISE" | null;
  limit: number;
};

type StatusFilter = "ALL" | SmartLinkListItem["status"];
type TypeFilter = "ALL" | SmartLinkListItem["type"];

export default function SmartLinksManager({
  initialLinks,
  plan,
  limit,
}: SmartLinksManagerProps) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SmartLinkListItem | null>(null);
  const { pushToast } = useToast();
  const atLimit = links.length >= limit;
  const usage = limit ? Math.min(100, Math.round((links.length / limit) * 100)) : 0;

  const visibleLinks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return links.filter((smartLink) => {
      if (statusFilter !== "ALL" && smartLink.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && smartLink.type !== typeFilter) return false;
      if (!needle) return true;
      return [smartLink.title, smartLink.slug, smartLink.provider, smartLink.destinationUrl]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [links, query, statusFilter, typeFilter]);

  async function copyPublicUrl(slug: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
      setCopiedSlug(slug);
      pushToast({ title: "Public URL copied", tone: "success" });
      window.setTimeout(() => setCopiedSlug(null), 1600);
    } catch {
      pushToast({ title: "Could not copy URL", description: "Copy it manually from the Link editor.", tone: "error" });
    }
  }

  async function duplicateSmartLink(smartLink: SmartLinkListItem) {
    setActionError(null);
    setBusyLinkId(smartLink.id);
    try {
      const response = await fetch(`/api/smart-links/${smartLink.id}/duplicate`, { method: "POST" });
      const payload = await response.json().catch(() => null) as { smartLink?: { id: string }; error?: string } | null;
      if (!response.ok || !payload?.smartLink?.id) {
        const message = payload?.error ?? "Could not duplicate Smart Link.";
        setActionError(message);
        pushToast({ title: "Duplicate failed", description: message, tone: "error" });
        return;
      }
      router.push(`/dashboard/links/${payload.smartLink.id}`);
      router.refresh();
    } catch {
      const message = "Could not connect to the Linkzzz server.";
      setActionError(message);
      pushToast({ title: "Duplicate failed", description: message, tone: "error" });
    } finally {
      setBusyLinkId(null);
    }
  }

  async function deleteSmartLink(smartLink: SmartLinkListItem) {
    if (smartLink.status !== "DRAFT") {
      const message = "Move this Smart Link to Draft before deleting it.";
      setActionError(message);
      pushToast({ title: "Smart Link cannot be deleted", description: message, tone: "error" });
      return;
    }

    setActionError(null);
    setBusyLinkId(smartLink.id);
    try {
      const response = await fetch(`/api/smart-links/${smartLink.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revision: smartLink.revision }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        const message = payload?.error ?? "Could not delete Smart Link.";
        setActionError(message);
        pushToast({ title: "Delete failed", description: message, tone: "error" });
        return;
      }
      setLinks((current) => current.filter((item) => item.id !== smartLink.id));
      setPendingDelete(null);
      pushToast({ title: "Smart Link deleted", tone: "success" });
      router.refresh();
    } catch {
      const message = "Could not connect to the Linkzzz server.";
      setActionError(message);
      pushToast({ title: "Delete failed", description: message, tone: "error" });
    } finally {
      setBusyLinkId(null);
    }
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-violet-strong">Smart Link control center</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Smart Links</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Manage public URLs, destinations, deeplinks, geo rules and traffic controls from one place.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setError(null);
            setCreating(true);
          }}
          disabled={atLimit || !plan}
          className="w-full shrink-0 font-black sm:w-auto"
        >
          <Plus size={18} /> New Smart Link
        </Button>
      </div>

      <section className={cardClassName({ className: "mt-6 overflow-hidden p-4 sm:p-5" })}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-zinc-950">{links.length} of {limit} Smart Links</p>
            <p className="mt-1 text-xs text-zinc-500">{plan ? getPlanDefinition(plan).name : "No active plan"}</p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 sm:w-56">
            <div className="h-full rounded-full bg-brand-lime-strong transition-[width]" style={{ width: `${usage}%` }} />
          </div>
        </div>
        {atLimit && (
          <p className="mt-3 text-xs font-medium text-amber-700">
            Plan limit reached. Existing Smart Links remain available, but a new one cannot be created.
          </p>
        )}
      </section>

      {actionError && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {actionError}
        </div>
      )}

      {!!links.length && (
        <section className={cardClassName({ padding: "none", className: "mt-5 grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:p-4" })}>
          <label className="relative min-w-0">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Smart Links"
              className="bg-zinc-50 pl-10 focus:bg-white"
            />
          </label>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            aria-label="Filter by status"
            className="font-semibold text-zinc-700"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="DISABLED">Disabled</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            aria-label="Filter by type"
            className="font-semibold text-zinc-700"
          >
            <option value="ALL">All types</option>
            <option value="LANDING_PAGE">Landing page</option>
            <option value="DIRECT">Direct</option>
          </Select>
        </section>
      )}

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        {visibleLinks.map((smartLink) => {
          const Icon = smartLink.type === "LANDING_PAGE" ? FileText : Route;
          return (
            <article
              key={smartLink.id}
              className={cardClassName({ padding: "none", interactive: true, className: "group p-4 sm:p-5" })}
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-bold text-zinc-950">{smartLink.title}</h2>
                    <StatusBadge status={smartLink.status} />
                    {smartLink.shieldEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
                        <ShieldCheck size={11} /> Shield
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-500">/{smartLink.slug}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-zinc-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {smartLink.type === "LANDING_PAGE" ? "Landing page" : smartLink.provider || "Direct destination"}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-zinc-700">
                  {smartLink.type === "LANDING_PAGE" ? "Page cards, socials and appearance" : smartLink.destinationUrl}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric icon={Eye} label="Views" value={smartLink.views} />
                <Metric icon={MousePointerClick} label="Clicks" value={smartLink.clicks} />
                <div className="col-span-2 rounded-xl border border-zinc-100 px-3 py-2 sm:col-span-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Updated</p>
                  <p className="mt-1 truncate text-xs font-bold text-zinc-700">{formatUpdated(smartLink.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
                <Link
                  href={`/dashboard/links/${smartLink.id}`}
                  className={buttonClassName({ variant: "accent", size: "sm" })}
                >
                  Edit <ArrowUpRight size={15} />
                </Link>
                <Link
                  href={`/dashboard/analytics/${smartLink.id}`}
                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                >
                  Analytics <BarChart3 size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => copyPublicUrl(smartLink.slug)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {copiedSlug === smartLink.slug ? <Check size={15} /> : <Copy size={15} />}
                  {copiedSlug === smartLink.slug ? "Copied" : "Copy"}
                </button>
                {smartLink.status === "PUBLISHED" ? (
                  <Link
                    href={`/${smartLink.slug}`}
                    target="_blank"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                  >
                    Open <ExternalLink size={15} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-300"
                  >
                    Not live <ExternalLink size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void duplicateSmartLink(smartLink)}
                  disabled={atLimit || smartLink.status === "DISABLED" || busyLinkId === smartLink.id}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Files size={15} /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(smartLink)}
                  disabled={smartLink.status !== "DRAFT" || busyLinkId === smartLink.id}
                  title={smartLink.status === "DRAFT" ? "Delete Smart Link" : "Move to Draft before deleting"}
                  className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent sm:col-span-1 sm:ml-auto"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!links.length && (
        <EmptyState
          className="mt-5"
          icon={<Link2 size={22} />}
          title="Create your first Smart Link"
          description="Start with a Landing Page or send visitors directly to one destination."
          action={
            <Button variant="primary" onClick={() => setCreating(true)} disabled={atLimit || !plan}>
              <Plus size={16} /> Create Smart Link
            </Button>
          }
        />
      )}

      {!!links.length && !visibleLinks.length && (
        <EmptyState
          className="mt-4"
          icon={<Search size={21} />}
          title="No Smart Links match these filters"
          description="Clear the search or broaden the status and type filters."
          action={<Button variant="secondary" onClick={() => { setQuery(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}>Clear filters</Button>}
        />
      )}

      {creating && (
        <CreateSmartLinkDialog
          submitting={submitting}
          error={error}
          onClose={() => !submitting && setCreating(false)}
          onSubmit={async (input) => {
            setSubmitting(true);
            setError(null);
            try {
              const response = await fetch("/api/smart-links", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(input),
              });
              const payload = await response.json().catch(() => null) as {
                smartLink?: { id: string };
                error?: string;
              } | null;
              if (!response.ok || !payload?.smartLink?.id) {
                const message = payload?.error ?? "Could not create Smart Link.";
                setError(message);
                pushToast({ title: "Create failed", description: message, tone: "error" });
                return;
              }
              setCreating(false);
              pushToast({ title: "Smart Link created", description: "Opening the editor…", tone: "success" });
              router.push(`/dashboard/links/${payload.smartLink.id}`);
              router.refresh();
            } catch {
              const message = "Could not connect to the Linkzzz server.";
              setError(message);
              pushToast({ title: "Create failed", description: message, tone: "error" });
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={pendingDelete ? `Delete ${pendingDelete.title}?` : "Delete Smart Link?"}
        description="This permanently removes the Smart Link, its Landing Page content, analytics and custom-domain configuration. This cannot be undone."
        confirmLabel="Delete permanently"
        destructive
        busy={Boolean(pendingDelete && busyLinkId === pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteSmartLink(pendingDelete);
        }}
      />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-100 px-3 py-2">
      <div className="flex items-center gap-1.5 text-zinc-400">
        <Icon size={13} />
        <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1 text-sm font-black text-zinc-950">{value.toLocaleString("en-US")}</p>
    </div>
  );
}

function CreateSmartLinkDialog({ submitting, error, onClose, onSubmit }: {
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: {
    type: "LANDING_PAGE" | "DIRECT";
    title: string;
    slug: string;
    primaryDestination?: DestinationConfig;
  }) => Promise<void>;
}) {
  const [type, setType] = useState<"LANDING_PAGE" | "DIRECT">("LANDING_PAGE");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [destination, setDestination] = useState<DestinationConfig>({
    provider: "CUSTOM",
    value: "",
    url: "",
  });
  const suggestedSlug = useMemo(() => slugify(title), [title]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedSlug = slug.trim() || suggestedSlug;
    if (type === "DIRECT" && !destination.url) return;
    void onSubmit({
      type,
      title,
      slug: normalizedSlug,
      ...(type === "DIRECT" ? { primaryDestination: destination } : {}),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <form
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !submitting) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-smart-link-title"
        aria-describedby="create-smart-link-description"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="create-smart-link-title" className="text-xl font-black tracking-tight text-zinc-950">New Smart Link</h2>
            <p id="create-smart-link-description" className="mt-1 text-sm text-zinc-500">Create the URL first, then finish configuration in the editor.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100" aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          {([
            ["LANDING_PAGE", "Landing page", FileText],
            ["DIRECT", "Direct", Route],
          ] as const).map(([value, label, Icon]) => (
            <button key={value} type="button" onClick={() => setType(value)} className={`rounded-2xl border p-4 text-left transition ${type === value ? "border-brand-violet bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15" : "border-zinc-200 text-zinc-700 hover:border-brand-violet/50"}`}>
              <Icon size={20} />
              <span className="mt-3 block text-sm font-bold">{label}</span>
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm font-bold text-zinc-800">
          Name
          <Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} placeholder="Summer campaign" className="mt-2" />
        </label>

        <label className="mt-4 block text-sm font-bold text-zinc-800">
          Public URL
          <div className="mt-2 flex min-w-0 items-center rounded-xl border border-zinc-200 bg-white focus-within:border-zinc-950">
            <span className="shrink-0 pl-3 text-sm text-zinc-400">linkzzz.com/</span>
            <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40))} required={!suggestedSlug} maxLength={40} placeholder={suggestedSlug || "summer-campaign"} className="min-h-11 min-w-0 flex-1 rounded-xl px-1 pr-3 text-sm outline-none" />
          </div>
        </label>

        {type === "DIRECT" && (
          <div className="mt-4">
            <DestinationPicker value={destination} onChange={setDestination} title="Primary destination" />
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting || !title.trim() || (type === "DIRECT" && !destination.url)} className="font-black">
            {submitting ? "Creating…" : "Create & configure"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function StatusBadge({ status }: { status: SmartLinkListItem["status"] }) {
  const tone = status === "PUBLISHED" ? "success" : status === "DISABLED" ? "danger" : "accent";
  return <Badge tone={tone}>{status}</Badge>;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
