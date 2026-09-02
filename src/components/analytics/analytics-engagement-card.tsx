import { MousePointerClick } from "lucide-react";

import type { AnalyticsEngagement } from "@/types/analytics";

export default function AnalyticsEngagementCard({ data }: { data: AnalyticsEngagement }) {
  const items = [
    { label: "Card clicks", value: data.cardClicks },
    { label: "Social clicks", value: data.socialClicks },
    { label: "Other CTA clicks", value: data.otherClicks },
  ];
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-lime-soft text-zinc-800">
          <MousePointerClick size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-950">Engagement</h2>
          <p className="mt-1 text-sm text-zinc-500">Where visitors interact after opening a Landing Page.</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-zinc-700">{item.label}</p>
              <p className="text-sm font-black text-zinc-950">{item.value.toLocaleString("en-US")}</p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand-lime-strong"
                style={{ width: `${Math.round((item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between rounded-xl bg-zinc-50 p-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total clicks</span>
        <span className="text-2xl font-black tracking-tight text-zinc-950">{data.totalClicks.toLocaleString("en-US")}</span>
      </div>
    </section>
  );
}
