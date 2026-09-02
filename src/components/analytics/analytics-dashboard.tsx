"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";

import EmptyState from "@/components/ui/empty-state";

import AnalyticsBreakdownCard from "@/components/analytics/analytics-breakdown-card";
import AnalyticsEngagementCard from "@/components/analytics/analytics-engagement-card";
import AnalyticsKpiGrid from "@/components/analytics/analytics-kpi-grid";
import AnalyticsLinkPerformance from "@/components/analytics/analytics-link-performance";
import AnalyticsPeriodTabs from "@/components/analytics/analytics-period-tabs";
import AnalyticsPrivacyCard from "@/components/analytics/analytics-privacy-card";
import AnalyticsRuntimeCard from "@/components/analytics/analytics-runtime-card";
import PeakActivityCard from "@/components/analytics/peak-activity-card";
import TopLinksCard from "@/components/analytics/top-links-card";
import TrafficChart from "@/components/analytics/traffic-chart";
import { ANALYTICS_PERIODS } from "@/features/analytics/analytics-periods";
import type {
  AnalyticsPeriod,
  AnalyticsScope,
  AnalyticsSnapshot,
} from "@/types/analytics";

type Props = {
  snapshots: Record<AnalyticsPeriod, AnalyticsSnapshot>;
  scope?: AnalyticsScope | null;
};

export default function AnalyticsDashboard({ snapshots, scope = null }: Props) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const snapshot = snapshots[period];
  const periodDefinition =
    ANALYTICS_PERIODS.find((item) => item.value === period) ?? ANALYTICS_PERIODS[2];
  const hasTraffic = snapshot.traffic.some((point) => point.visits > 0 || point.clicks > 0);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">
              {scope ? `${scope.title} performance` : "Workspace performance"}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              {scope
                ? "Human traffic, destination clicks and runtime events for this Link."
                : "Human traffic and engagement across all of your Links."}
            </p>
          </div>

          <AnalyticsPeriodTabs value={period} onChange={setPeriod} />
        </div>
      </section>

      <AnalyticsKpiGrid
        stats={snapshot.kpis}
        comparisonLabel={periodDefinition.comparisonLabel}
      />

      {!hasTraffic ? (
        <EmptyState
          icon={<BarChart3 size={21} />}
          title="No traffic in this period yet"
          description={scope ? "Open or share this Link, then come back after it receives human traffic." : "Publish and share a Link. Analytics will appear here after the first human visit."}
        />
      ) : (
        <TrafficChart data={snapshot.traffic} />
      )}

      {!scope ? (
        <AnalyticsLinkPerformance links={snapshot.linkPerformance} />
      ) : scope.type === "LANDING_PAGE" ? (
        <TopLinksCard links={snapshot.topLinks} />
      ) : null}

      <div className={`grid min-w-0 gap-6 ${scope?.type === "DIRECT" ? "xl:grid-cols-1" : "xl:grid-cols-2"}`}>
        {!scope || scope.type === "LANDING_PAGE" ? (
          <AnalyticsEngagementCard data={snapshot.engagement} />
        ) : null}
        <AnalyticsRuntimeCard data={snapshot.runtime} />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsBreakdownCard
          title="Traffic sources"
          description="Where human visits came from before opening your Linkzzz URL."
          data={snapshot.trafficSources}
        />
        <AnalyticsBreakdownCard
          title="Countries"
          description="Approximate network-level country distribution for human visits."
          data={snapshot.countries}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <AnalyticsBreakdownCard
          title="Devices"
          description="Device classes used by your visitors."
          data={snapshot.devices}
        />
        <AnalyticsBreakdownCard
          title="Browsers"
          description="Browsers and in-app browsers seen in traffic."
          data={snapshot.browsers}
        />
        <AnalyticsBreakdownCard
          title="Operating systems"
          description="Operating systems reported by visitor devices."
          data={snapshot.operatingSystems}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <PeakActivityCard data={snapshot.peakActivity} />
        <AnalyticsPrivacyCard />
      </div>
    </div>
  );
}
