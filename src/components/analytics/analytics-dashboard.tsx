"use client";

import { useState } from "react";

import AnalyticsBreakdownCard from "@/components/analytics/analytics-breakdown-card";
import AnalyticsKpiGrid from "@/components/analytics/analytics-kpi-grid";
import AnalyticsPeriodTabs from "@/components/analytics/analytics-period-tabs";
import AnalyticsPrivacyCard from "@/components/analytics/analytics-privacy-card";
import PeakActivityCard from "@/components/analytics/peak-activity-card";
import TopLinksCard from "@/components/analytics/top-links-card";
import TrafficChart from "@/components/analytics/traffic-chart";
import {
  ANALYTICS_PERIODS,
} from "@/features/analytics/mock-analytics";
import type { AnalyticsPeriod, AnalyticsSnapshot } from "@/types/analytics";

export default function AnalyticsDashboard({ snapshots }: { snapshots: Record<AnalyticsPeriod, AnalyticsSnapshot> }) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const snapshot = snapshots[period];
  const periodDefinition = ANALYTICS_PERIODS.find((item) => item.value === period) ?? ANALYTICS_PERIODS[2];

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">Performance overview</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Live analytics collected from your public profile.
            </p>
          </div>

          <AnalyticsPeriodTabs value={period} onChange={setPeriod} />
        </div>
      </section>

      <AnalyticsKpiGrid stats={snapshot.kpis} comparisonLabel={periodDefinition.comparisonLabel} />
      <TrafficChart data={snapshot.traffic} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <TopLinksCard links={snapshot.topLinks} />
        <AnalyticsBreakdownCard
          title="Traffic sources"
          description="Where visitors came from before opening your profile."
          data={snapshot.trafficSources}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <AnalyticsBreakdownCard
          title="Countries"
          description="Approximate visitor country based on network location."
          data={snapshot.countries}
        />
        <AnalyticsBreakdownCard
          title="Cities"
          description="Approximate city-level audience distribution."
          data={snapshot.cities}
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <AnalyticsBreakdownCard
          title="Devices"
          description="Device classes used to open your profile."
          data={snapshot.devices}
        />
        <AnalyticsBreakdownCard
          title="Browsers"
          description="Browsers used by your visitors."
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
