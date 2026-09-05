import assert from "node:assert/strict";
import test from "node:test";

import { ANALYTICS_PERIOD_VALUES } from "@/features/analytics/analytics-period-ranges";
import {
  buildAnalyticsDashboardFromSummaries,
  type AnalyticsPeriodSummary,
} from "@/features/analytics/analytics-summary-builder";
import type { AnalyticsSmartLinkRecord } from "@/server/services/contracts";
import type { AnalyticsPeriod } from "@/types/analytics";

const NOW = new Date("2026-09-04T18:30:00.000Z");

const smartLinks: AnalyticsSmartLinkRecord[] = [
  {
    id: "landing-1",
    title: "Artist page",
    slug: "artist",
    type: "LANDING_PAGE",
    status: "PUBLISHED",
    pageCards: [
      {
        id: "card-1",
        title: "Spotify",
        url: "https://open.spotify.com/artist/demo",
      },
    ],
  },
  {
    id: "direct-1",
    title: "Direct campaign",
    slug: "go",
    type: "DIRECT",
    status: "DRAFT",
    pageCards: [],
  },
];

test("SQL summaries retain the existing analytics dashboard contract", () => {
  const summaries = summariesWith(
    summary("today", {
      current: { visits: 3, uniqueVisitors: 2, clicks: 2 },
      previous: { visits: 2, uniqueVisitors: 1, clicks: 1 },
      traffic: [
        {
          bucket: "2026-09-04T10:00:00.000Z",
          visits: 3,
          uniqueVisitors: 2,
          clicks: 2,
        },
      ],
      linkPerformance: [
        {
          smartLinkId: "landing-1",
          visits: 3,
          uniqueVisitors: 2,
          clicks: 2,
        },
      ],
      topCardClicks: [{ pageCardId: "card-1", clicks: 2 }],
      breakdowns: [
        { kind: "sources", name: "instagram.com", count: 2 },
        { kind: "sources", name: "Direct", count: 1 },
        { kind: "countries", name: "RS", count: 3 },
        { kind: "devices", name: "Mobile", count: 3 },
        { kind: "browsers", name: "Safari", count: 3 },
        { kind: "operatingSystems", name: "iOS", count: 3 },
      ],
      peakHour: { value: 10, count: 3 },
      peakWeekday: { value: 5, count: 3 },
      runtime: {
        deeplinkAttempts: 2,
        deeplinkFallbacks: 1,
        shieldBlocks: 4,
      },
      engagement: { cardClicks: 2, socialClicks: 0, otherClicks: 0 },
      earliestHumanEventAt: "2026-09-04T10:00:00.000Z",
    }),
  );

  const dashboard = buildAnalyticsDashboardFromSummaries({
    summaries,
    smartLinks,
    now: NOW,
  });
  assert.ok(dashboard);
  const today = dashboard.snapshots.today;

  assert.deepEqual(
    today.kpis.map(({ key, value }) => ({ key, value })),
    [
      { key: "visits", value: "3" },
      { key: "uniqueVisitors", value: "2" },
      { key: "linkClicks", value: "2" },
      { key: "ctr", value: "66.7%" },
    ],
  );
  assert.equal(today.traffic.length, 19);
  assert.deepEqual(today.traffic[10], {
    label: "10:00",
    visits: 3,
    unique: 2,
    clicks: 2,
  });
  assert.equal(today.linkPerformance[0]?.id, "landing-1");
  assert.equal(today.linkPerformance[1]?.visits, 0);
  assert.equal(today.topLinks[0]?.name, "Spotify");
  assert.equal(today.topLinks[0]?.percentage, 100);
  assert.equal(today.countries[0]?.name, "Serbia");
  assert.equal(today.runtime.deeplinkFallbackRate, 50);
  assert.equal(today.runtime.shieldBlocks, 4);
  assert.equal(today.engagement.totalClicks, 2);
  assert.equal(today.peakActivity.weekdayLabel, "Friday");
});

test("all-time SQL buckets are padded without expanding raw events", () => {
  const summaries = summariesWith(
    summary("all", {
      current: { visits: 2, uniqueVisitors: 2, clicks: 0 },
      traffic: [
        {
          bucket: "2026-07-01T00:00:00.000Z",
          visits: 1,
          uniqueVisitors: 1,
          clicks: 0,
        },
        {
          bucket: "2026-09-01T00:00:00.000Z",
          visits: 1,
          uniqueVisitors: 1,
          clicks: 0,
        },
      ],
      earliestHumanEventAt: "2026-07-14T12:00:00.000Z",
    }),
  );
  const dashboard = buildAnalyticsDashboardFromSummaries({
    summaries,
    smartLinks,
    now: NOW,
  });
  assert.ok(dashboard);

  assert.deepEqual(dashboard.snapshots.all.traffic, [
    { label: "Jul 26", visits: 1, unique: 1, clicks: 0 },
    { label: "Aug 26", visits: 0, unique: 0, clicks: 0 },
    { label: "Sep 26", visits: 1, unique: 1, clicks: 0 },
  ]);
});

test("scoped SQL analytics rejects a Smart Link outside the owned metadata", () => {
  assert.equal(
    buildAnalyticsDashboardFromSummaries({
      summaries: ANALYTICS_PERIOD_VALUES.map((period) => summary(period)),
      smartLinks,
      scopeSmartLinkId: "not-owned",
      now: NOW,
    }),
    null,
  );
});

function summariesWith(replacement: AnalyticsPeriodSummary) {
  return ANALYTICS_PERIOD_VALUES.map((period) =>
    period === replacement.period ? replacement : summary(period),
  );
}

function summary(
  period: AnalyticsPeriod,
  patch: Partial<AnalyticsPeriodSummary> = {},
): AnalyticsPeriodSummary {
  return {
    period,
    current: { visits: 0, uniqueVisitors: 0, clicks: 0 },
    previous: { visits: 0, uniqueVisitors: 0, clicks: 0 },
    traffic: [],
    linkPerformance: [],
    topCardClicks: [],
    breakdowns: [],
    peakHour: null,
    peakWeekday: null,
    runtime: {
      deeplinkAttempts: 0,
      deeplinkFallbacks: 0,
      shieldBlocks: 0,
    },
    engagement: { cardClicks: 0, socialClicks: 0, otherClicks: 0 },
    earliestHumanEventAt: null,
    ...patch,
  };
}
