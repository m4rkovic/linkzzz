import assert from "node:assert/strict";
import test from "node:test";

import { buildAnalyticsDashboardData } from "@/features/analytics/analytics-aggregator";
import type {
  AnalyticsEventRecord,
  AnalyticsSmartLinkRecord,
} from "@/server/services/contracts";

const NOW = new Date("2026-09-02T18:00:00.000Z");

const smartLinks: AnalyticsSmartLinkRecord[] = [
  {
    id: "landing-1",
    title: "Artist page",
    slug: "artist",
    type: "LANDING_PAGE",
    status: "PUBLISHED",
    pageCards: [
      { id: "card-1", title: "Spotify", url: "https://open.spotify.com/artist/demo" },
      { id: "card-2", title: "Store", url: "https://shop.example.com" },
    ],
  },
  {
    id: "direct-1",
    title: "Direct campaign",
    slug: "go",
    type: "DIRECT",
    status: "PUBLISHED",
    pageCards: [],
  },
];

const events: AnalyticsEventRecord[] = [
  event("landing-1", "SMART_LINK_VIEW", "2026-09-02T10:00:00.000Z", { visitorId: "visitor-a" }),
  event("landing-1", "PAGE_VIEW", "2026-09-02T10:00:01.000Z", { visitorId: "visitor-a" }),
  event("landing-1", "SMART_LINK_VIEW", "2026-09-02T11:00:00.000Z", { visitorId: "visitor-b" }),
  event("landing-1", "LINK_CLICK", "2026-09-02T11:05:00.000Z", { pageCardId: "card-1" }),
  event("landing-1", "SOCIAL_CLICK", "2026-09-02T11:06:00.000Z"),
  event("landing-1", "DEEPLINK_ATTEMPT", "2026-09-02T11:07:00.000Z"),
  event("landing-1", "DEEPLINK_FALLBACK", "2026-09-02T11:07:05.000Z"),
  event("landing-1", "SMART_LINK_VIEW", "2026-09-02T12:00:00.000Z", { isBot: true }),
  event("landing-1", "BLOCKED_AUTOMATED_REQUEST", "2026-09-02T12:00:00.000Z", { isBot: true }),
  event("direct-1", "SMART_LINK_VIEW", "2026-09-02T13:00:00.000Z", { visitorId: "visitor-c" }),
];

test("analytics uses Smart Link views without double-counting legacy PAGE_VIEW events", () => {
  const data = buildAnalyticsDashboardData({ events, smartLinks, now: NOW });
  assert.ok(data);
  const today = data.snapshots.today;

  assert.equal(today.kpis.find((item) => item.key === "visits")?.value, "3");
  assert.equal(today.kpis.find((item) => item.key === "uniqueVisitors")?.value, "3");
  assert.equal(today.kpis.find((item) => item.key === "linkClicks")?.value, "2");
});

test("bot traffic is excluded from audience KPIs but Shield blocks remain visible", () => {
  const data = buildAnalyticsDashboardData({ events, smartLinks, now: NOW });
  assert.ok(data);

  assert.equal(data.snapshots.today.runtime.shieldBlocks, 1);
  assert.equal(data.snapshots.today.runtime.deeplinkAttempts, 1);
  assert.equal(data.snapshots.today.runtime.deeplinkFallbacks, 1);
  assert.equal(data.snapshots.today.runtime.deeplinkFallbackRate, 100);
});

test("engagement and top card destinations use attributable click data", () => {
  const data = buildAnalyticsDashboardData({ events, smartLinks, now: NOW });
  assert.ok(data);
  const today = data.snapshots.today;

  assert.deepEqual(today.engagement, {
    cardClicks: 1,
    socialClicks: 1,
    otherClicks: 0,
    totalClicks: 2,
  });
  assert.equal(today.topLinks[0]?.name, "Spotify");
  assert.equal(today.topLinks[0]?.clicks, 1);
});

test("individual Link analytics are ownership-scoped by supplied Smart Link context", () => {
  const data = buildAnalyticsDashboardData({
    events,
    smartLinks,
    scopeSmartLinkId: "landing-1",
    now: NOW,
  });
  assert.ok(data?.scope);
  assert.equal(data.scope.id, "landing-1");
  assert.equal(data.snapshots.today.linkPerformance.length, 1);
  assert.equal(data.snapshots.today.linkPerformance[0]?.id, "landing-1");
  assert.equal(data.snapshots.today.kpis.find((item) => item.key === "visits")?.value, "2");
});

test("unknown Smart Link scope returns null instead of exposing another Link", () => {
  const data = buildAnalyticsDashboardData({
    events,
    smartLinks,
    scopeSmartLinkId: "not-owned",
    now: NOW,
  });
  assert.equal(data, null);
});

function event(
  smartLinkId: string,
  type: AnalyticsEventRecord["type"],
  createdAt: string,
  patch: Partial<AnalyticsEventRecord> = {},
): AnalyticsEventRecord {
  return {
    smartLinkId,
    type,
    createdAt: new Date(createdAt),
    referrer: "https://instagram.com/",
    countryCode: "RS",
    device: "Mobile",
    browser: "Safari",
    os: "iOS",
    isBot: false,
    ...patch,
  };
}
