export type SmartLinkDashboardEvent = {
  smartLinkId: string;
  isBot?: boolean;
  type:
    | "PAGE_VIEW"
    | "LINK_CLICK"
    | "SOCIAL_CLICK"
    | "SMART_LINK_VIEW"
    | "DEEPLINK_ATTEMPT"
    | "DEEPLINK_FALLBACK"
    | "BLOCKED_AUTOMATED_REQUEST";
};

export type SmartLinkDashboardMetric = {
  views: number;
  clicks: number;
};

export type SmartLinkDashboardCount = {
  smartLinkId: string;
  smartViews: number;
  legacyViews: number;
  clicks: number;
};

export function buildSmartLinkDashboardMetrics(
  events: SmartLinkDashboardEvent[],
): Map<string, SmartLinkDashboardMetric> {
  const raw = new Map<string, { smartViews: number; legacyViews: number; clicks: number }>();

  for (const event of events) {
    if (event.isBot) continue;
    const current = raw.get(event.smartLinkId) ?? {
      smartViews: 0,
      legacyViews: 0,
      clicks: 0,
    };

    if (event.type === "SMART_LINK_VIEW") current.smartViews += 1;
    else if (event.type === "PAGE_VIEW") current.legacyViews += 1;
    else if (event.type === "LINK_CLICK" || event.type === "SOCIAL_CLICK") current.clicks += 1;

    raw.set(event.smartLinkId, current);
  }

  return new Map(
    [...raw.entries()].map(([smartLinkId, value]) => [
      smartLinkId,
      {
        views: value.smartViews || value.legacyViews,
        clicks: value.clicks,
      },
    ]),
  );
}

export function buildSmartLinkDashboardMetricsFromCounts(
  counts: SmartLinkDashboardCount[],
): Map<string, SmartLinkDashboardMetric> {
  return new Map(
    counts.map((count) => [
      count.smartLinkId,
      {
        views: count.smartViews || count.legacyViews,
        clicks: count.clicks,
      },
    ]),
  );
}
