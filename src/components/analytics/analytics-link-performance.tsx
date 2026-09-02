import Link from "next/link";
import { ArrowUpRight, FileText, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SmartLinkAnalyticsItem } from "@/types/analytics";

type Props = {
  links: SmartLinkAnalyticsItem[];
};

export default function AnalyticsLinkPerformance({ links }: Props) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold text-zinc-950">Link performance</h2>
        <p className="mt-1 text-sm text-zinc-500">Compare every Link, then open its detailed analytics.</p>
      </div>

      {links.length ? (
        <div className="divide-y divide-zinc-100">
          {links.map((link) => {
            const Icon = link.type === "LANDING_PAGE" ? FileText : Route;
            return (
              <Link
                key={link.id}
                href={`/dashboard/analytics/${link.id}`}
                className="group grid min-w-0 gap-3 px-4 py-4 transition hover:bg-zinc-50 sm:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(76px,0.5fr))_32px] sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-zinc-950">{link.title}</p>
                      <StatusBadge status={link.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-400">/{link.slug}</p>
                  </div>
                </div>

                <Metric label="Visits" value={link.visits.toLocaleString("en-US")} />
                <Metric label="Unique" value={link.uniqueVisitors.toLocaleString("en-US")} />
                <Metric label="Clicks" value={link.clicks.toLocaleString("en-US")} />
                <Metric label="CTR" value={`${link.ctr.toFixed(1)}%`} />
                <ArrowUpRight size={16} className="hidden text-zinc-300 transition group-hover:text-zinc-700 sm:block" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-semibold text-zinc-700">No Links yet</p>
          <p className="mt-1 text-xs text-zinc-400">Create a Smart Link and its analytics will appear here.</p>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</span>
      <p className="text-sm font-black text-zinc-900 sm:mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: SmartLinkAnalyticsItem["status"] }) {
  const tone = status === "PUBLISHED" ? "success" : status === "DISABLED" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
