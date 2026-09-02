import { Eye, MousePointerClick, Percent, Users } from "lucide-react";
import type { ElementType } from "react";

import type { AnalyticsKpi, AnalyticsMetricKey } from "@/types/analytics";

const metricIcons: Record<AnalyticsMetricKey, ElementType> = {
  visits: Eye,
  uniqueVisitors: Users,
  linkClicks: MousePointerClick,
  ctr: Percent,
};

type Props = {
  stats: AnalyticsKpi[];
  comparisonLabel: string;
};

export default function AnalyticsKpiGrid({ stats, comparisonLabel }: Props) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = metricIcons[stat.key];
        const trendClass =
          stat.trend === "up"
            ? "text-emerald-600"
            : stat.trend === "down"
              ? "text-red-600"
              : "text-zinc-500";

        return (
          <article key={stat.key} className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{stat.value}</p>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`text-xs font-bold ${trendClass}`}>{stat.change}</span>
              {stat.trend !== "none" ? (
                <span className="text-xs text-zinc-400">{comparisonLabel}</span>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
