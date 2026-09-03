import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSmartLinkDashboardMetrics,
  buildSmartLinkDashboardMetricsFromCounts,
} from "../src/features/smart-links/dashboard-metrics";

test("dashboard metrics prefer authoritative SmartLink views over legacy page views", () => {
  const metrics = buildSmartLinkDashboardMetrics([
    { smartLinkId: "a", type: "PAGE_VIEW" },
    { smartLinkId: "a", type: "PAGE_VIEW" },
    { smartLinkId: "a", type: "SMART_LINK_VIEW" },
    { smartLinkId: "a", type: "LINK_CLICK" },
    { smartLinkId: "a", type: "SOCIAL_CLICK" },
  ]);

  assert.deepEqual(metrics.get("a"), { views: 1, clicks: 2 });
});

test("dashboard metrics retain legacy page views when no SmartLink view exists", () => {
  const metrics = buildSmartLinkDashboardMetrics([
    { smartLinkId: "legacy", type: "PAGE_VIEW" },
    { smartLinkId: "legacy", type: "PAGE_VIEW" },
  ]);

  assert.deepEqual(metrics.get("legacy"), { views: 2, clicks: 0 });
});

test("dashboard metrics ignore bot traffic after analytics repositories expose Shield events", () => {
  const metrics = buildSmartLinkDashboardMetrics([
    { smartLinkId: "a", type: "SMART_LINK_VIEW", isBot: false },
    { smartLinkId: "a", type: "SMART_LINK_VIEW", isBot: true },
    { smartLinkId: "a", type: "BLOCKED_AUTOMATED_REQUEST", isBot: true },
  ]);

  assert.deepEqual(metrics.get("a"), { views: 1, clicks: 0 });
});

test("database summaries preserve SmartLink-over-legacy view precedence", () => {
  const metrics = buildSmartLinkDashboardMetricsFromCounts([
    {
      smartLinkId: "current",
      smartViews: 4,
      legacyViews: 9,
      clicks: 3,
    },
    {
      smartLinkId: "legacy",
      smartViews: 0,
      legacyViews: 7,
      clicks: 2,
    },
  ]);

  assert.deepEqual(metrics.get("current"), { views: 4, clicks: 3 });
  assert.deepEqual(metrics.get("legacy"), { views: 7, clicks: 2 });
});
