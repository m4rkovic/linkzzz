import { LINK_GEO_COUNTRIES } from "@/features/links/link-geo";
import type {
  AnalyticsBreakdownItem,
  AnalyticsDashboardData,
  AnalyticsEngagement,
  AnalyticsKpi,
  AnalyticsPeriod,
  AnalyticsRuntimeHealth,
  AnalyticsSnapshot,
  PeakActivity,
  SmartLinkAnalyticsItem,
  TopLinkAnalytics,
  TrafficPoint,
} from "@/types/analytics";
import type {
  AnalyticsEventRecord,
  AnalyticsSmartLinkRecord,
} from "@/server/services/contracts";

const PERIODS: AnalyticsPeriod[] = ["today", "7d", "30d", "90d", "all"];
const DAY_MS = 86_400_000;
const COUNTRY_NAMES = new Map(LINK_GEO_COUNTRIES.map((country) => [country.code, country.name]));

export function buildAnalyticsDashboardData(input: {
  events: AnalyticsEventRecord[];
  smartLinks: AnalyticsSmartLinkRecord[];
  scopeSmartLinkId?: string;
  now?: Date;
}): AnalyticsDashboardData | null {
  const now = input.now ?? new Date();
  const scope = input.scopeSmartLinkId
    ? input.smartLinks.find((smartLink) => smartLink.id === input.scopeSmartLinkId) ?? null
    : null;

  if (input.scopeSmartLinkId && !scope) return null;

  const scopedEvents = scope
    ? input.events.filter((event) => event.smartLinkId === scope.id)
    : input.events;
  const scopedLinks = scope ? [scope] : input.smartLinks;

  const snapshots = Object.fromEntries(
    PERIODS.map((period) => [period, buildSnapshot(period, scopedEvents, scopedLinks, now)]),
  ) as Record<AnalyticsPeriod, AnalyticsSnapshot>;

  return {
    snapshots,
    scope: scope
      ? {
          id: scope.id,
          title: scope.title,
          slug: scope.slug,
          type: scope.type,
          status: scope.status,
        }
      : null,
  };
}

function buildSnapshot(
  period: AnalyticsPeriod,
  allEvents: AnalyticsEventRecord[],
  smartLinks: AnalyticsSmartLinkRecord[],
  now: Date,
): AnalyticsSnapshot {
  const range = periodRange(period, now);
  const events = filterRange(allEvents, range.start, range.end);
  const previousEvents = range.previousStart
    ? filterRange(allEvents, range.previousStart, range.previousEnd)
    : [];

  const humanEvents = events.filter(isHumanEvent);
  const previousHumanEvents = previousEvents.filter(isHumanEvent);
  const views = viewEvents(humanEvents);
  const previousViews = viewEvents(previousHumanEvents);
  const clicks = clickEvents(humanEvents);
  const previousClicks = clickEvents(previousHumanEvents);
  const unique = uniqueVisitors(views);
  const previousUnique = uniqueVisitors(previousViews);
  const ctr = rate(clicks.length, views.length);
  const previousCtr = rate(previousClicks.length, previousViews.length);

  return {
    period,
    kpis: [
      countKpi("visits", "Visits", views.length, previousViews.length, period),
      countKpi("uniqueVisitors", "Unique visitors", unique, previousUnique, period),
      countKpi("linkClicks", "Clicks", clicks.length, previousClicks.length, period),
      rateKpi("ctr", "CTR", ctr, previousCtr, period),
    ],
    traffic: buildTraffic(period, humanEvents, now, range.start),
    linkPerformance: buildLinkPerformance(humanEvents, smartLinks),
    topLinks: buildTopLinks(humanEvents, smartLinks),
    trafficSources: breakdown(views, (event) => sourceName(event.referrer)),
    countries: breakdown(views, countryName),
    devices: breakdown(views, (event) => event.device || "Unknown"),
    browsers: breakdown(views, (event) => event.browser || "Unknown"),
    operatingSystems: breakdown(views, (event) => event.os || "Unknown"),
    peakActivity: peakActivity(views),
    runtime: runtimeHealth(events),
    engagement: engagement(humanEvents),
  };
}

function periodRange(period: AnalyticsPeriod, now: Date) {
  if (period === "all") {
    return { start: null, end: now, previousStart: null, previousEnd: null };
  }

  if (period === "today") {
    const start = startOfDay(now);
    const elapsed = now.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - DAY_MS);
    return {
      start,
      end: now,
      previousStart,
      previousEnd: new Date(previousStart.getTime() + elapsed),
    };
  }

  const days = Number(period.slice(0, -1));
  const start = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS));
  const previousEnd = start;
  const previousStart = new Date(start.getTime() - days * DAY_MS);
  return { start, end: now, previousStart, previousEnd };
}

function filterRange(events: AnalyticsEventRecord[], start: Date | null, end: Date | null) {
  return events.filter((event) => {
    const at = event.createdAt;
    if (!at) return false;
    if (start && at < start) return false;
    if (end && at >= end) return false;
    return true;
  });
}

function isHumanEvent(event: AnalyticsEventRecord) {
  return !event.isBot && event.type !== "BLOCKED_AUTOMATED_REQUEST";
}

function viewEvents(events: AnalyticsEventRecord[]) {
  const bySmartLink = new Map<string, AnalyticsEventRecord[]>();
  for (const event of events) {
    if (event.type !== "SMART_LINK_VIEW" && event.type !== "PAGE_VIEW") continue;
    const group = bySmartLink.get(event.smartLinkId) ?? [];
    group.push(event);
    bySmartLink.set(event.smartLinkId, group);
  }

  return [...bySmartLink.values()].flatMap((group) => {
    const smartViews = group.filter((event) => event.type === "SMART_LINK_VIEW");
    return smartViews.length ? smartViews : group.filter((event) => event.type === "PAGE_VIEW");
  });
}

function clickEvents(events: AnalyticsEventRecord[]) {
  return events.filter((event) => event.type === "LINK_CLICK" || event.type === "SOCIAL_CLICK");
}

function uniqueVisitors(events: AnalyticsEventRecord[]) {
  return new Set(
    events
      .map((event) => event.visitorId)
      .filter((visitorId): visitorId is string => Boolean(visitorId)),
  ).size;
}

function countKpi(
  key: "visits" | "uniqueVisitors" | "linkClicks",
  label: string,
  current: number,
  previous: number,
  period: AnalyticsPeriod,
): AnalyticsKpi {
  if (period === "all") {
    return { key, label, value: formatNumber(current), change: "All time", trend: "none" };
  }
  const delta = percentChange(current, previous);
  return {
    key,
    label,
    value: formatNumber(current),
    change: delta.label,
    trend: delta.trend,
  };
}

function rateKpi(
  key: "ctr",
  label: string,
  current: number,
  previous: number,
  period: AnalyticsPeriod,
): AnalyticsKpi {
  if (period === "all") {
    return { key, label, value: `${current.toFixed(1)}%`, change: "All time", trend: "none" };
  }
  const difference = current - previous;
  return {
    key,
    label,
    value: `${current.toFixed(1)}%`,
    change: `${difference > 0 ? "+" : ""}${difference.toFixed(1)} pp`,
    trend: difference > 0 ? "up" : difference < 0 ? "down" : "flat",
  };
}

function percentChange(current: number, previous: number) {
  if (!previous) {
    if (!current) return { label: "0.0%", trend: "flat" as const };
    return { label: "+100.0%", trend: "up" as const };
  }
  const value = ((current - previous) / previous) * 100;
  return {
    label: `${value > 0 ? "+" : ""}${value.toFixed(1)}%`,
    trend: value > 0 ? "up" as const : value < 0 ? "down" as const : "flat" as const,
  };
}

function buildLinkPerformance(
  events: AnalyticsEventRecord[],
  smartLinks: AnalyticsSmartLinkRecord[],
): SmartLinkAnalyticsItem[] {
  return smartLinks
    .map((smartLink) => {
      const scoped = events.filter((event) => event.smartLinkId === smartLink.id);
      const views = viewEvents(scoped);
      const clicks = clickEvents(scoped);
      return {
        id: smartLink.id,
        title: smartLink.title,
        slug: smartLink.slug,
        type: smartLink.type,
        status: smartLink.status,
        visits: views.length,
        uniqueVisitors: uniqueVisitors(views),
        clicks: clicks.length,
        ctr: rate(clicks.length, views.length),
      };
    })
    .sort((a, b) => b.visits - a.visits || b.clicks - a.clicks || a.title.localeCompare(b.title));
}

function buildTopLinks(
  events: AnalyticsEventRecord[],
  smartLinks: AnalyticsSmartLinkRecord[],
): TopLinkAnalytics[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.type === "LINK_CLICK" && event.pageCardId) {
      counts.set(event.pageCardId, (counts.get(event.pageCardId) ?? 0) + 1);
    }
  }

  const cards = smartLinks.flatMap((smartLink) =>
    smartLink.pageCards.map((card) => ({ ...card, smartLinkTitle: smartLink.title })),
  );
  const max = Math.max(0, ...cards.map((card) => counts.get(card.id) ?? 0));

  return cards
    .map((card) => ({
      id: card.id,
      name: card.title,
      url: hostname(card.url),
      smartLinkTitle: card.smartLinkTitle,
      clicks: counts.get(card.id) ?? 0,
      percentage: max ? Math.round(((counts.get(card.id) ?? 0) / max) * 100) : 0,
    }))
    .filter((card) => card.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6);
}

function engagement(events: AnalyticsEventRecord[]): AnalyticsEngagement {
  let cardClicks = 0;
  let socialClicks = 0;
  let otherClicks = 0;

  for (const event of events) {
    if (event.type === "SOCIAL_CLICK") socialClicks += 1;
    else if (event.type === "LINK_CLICK" && event.pageCardId) cardClicks += 1;
    else if (event.type === "LINK_CLICK") otherClicks += 1;
  }

  return {
    cardClicks,
    socialClicks,
    otherClicks,
    totalClicks: cardClicks + socialClicks + otherClicks,
  };
}

function runtimeHealth(events: AnalyticsEventRecord[]): AnalyticsRuntimeHealth {
  const deeplinkAttempts = events.filter((event) => event.type === "DEEPLINK_ATTEMPT" && !event.isBot).length;
  const deeplinkFallbacks = events.filter((event) => event.type === "DEEPLINK_FALLBACK" && !event.isBot).length;
  const shieldBlocks = events.filter((event) => event.type === "BLOCKED_AUTOMATED_REQUEST").length;
  return {
    deeplinkAttempts,
    deeplinkFallbacks,
    deeplinkFallbackRate: rate(deeplinkFallbacks, deeplinkAttempts),
    shieldBlocks,
  };
}

function breakdown(
  events: AnalyticsEventRecord[],
  key: (event: AnalyticsEventRecord) => string,
): AnalyticsBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const name = key(event);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({
      name,
      value: formatNumber(value),
      percentage: events.length ? Math.round((value / events.length) * 100) : 0,
    }));
}

function countryName(event: AnalyticsEventRecord) {
  if (event.countryName) return event.countryName;
  const code = event.countryCode?.toUpperCase();
  if (!code) return "Unknown";
  return COUNTRY_NAMES.get(code) ?? code;
}

function sourceName(referrer?: string | null) {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Other";
  }
}

function buildTraffic(
  period: AnalyticsPeriod,
  events: AnalyticsEventRecord[],
  now: Date,
  start: Date | null,
): TrafficPoint[] {
  if (period === "today") return hourlyTraffic(events, now);
  if (period === "all") return monthlyTraffic(events, now);
  return dailyTraffic(events, start ?? now, now);
}

function hourlyTraffic(events: AnalyticsEventRecord[], now: Date): TrafficPoint[] {
  const start = startOfDay(now);
  const points: TrafficPoint[] = [];
  for (let hour = 0; hour <= now.getUTCHours(); hour += 1) {
    const bucketStart = new Date(start.getTime() + hour * 3_600_000);
    const bucketEnd = new Date(bucketStart.getTime() + 3_600_000);
    points.push(pointForRange(events, bucketStart, bucketEnd, `${String(hour).padStart(2, "0")}:00`));
  }
  return points;
}

function dailyTraffic(events: AnalyticsEventRecord[], start: Date, now: Date): TrafficPoint[] {
  const points: TrafficPoint[] = [];
  const cursor = startOfDay(start);
  const last = startOfDay(now);
  while (cursor <= last) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor.getTime() + DAY_MS);
    points.push(
      pointForRange(
        events,
        bucketStart,
        bucketEnd,
        bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      ),
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

function monthlyTraffic(events: AnalyticsEventRecord[], now: Date): TrafficPoint[] {
  const datedEvents = events.filter((event) => event.createdAt);
  const earliest = datedEvents.length
    ? new Date(Math.min(...datedEvents.map((event) => event.createdAt!.getTime())))
    : now;
  const cursor = new Date(Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const points: TrafficPoint[] = [];

  while (cursor <= last) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    points.push(
      pointForRange(
        events,
        bucketStart,
        bucketEnd,
        bucketStart.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" }),
      ),
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return points;
}

function pointForRange(
  events: AnalyticsEventRecord[],
  start: Date,
  end: Date,
  label: string,
): TrafficPoint {
  const scoped = events.filter((event) => event.createdAt && event.createdAt >= start && event.createdAt < end);
  const views = viewEvents(scoped);
  return {
    label,
    visits: views.length,
    unique: uniqueVisitors(views),
    clicks: clickEvents(scoped).length,
  };
}

function peakActivity(events: AnalyticsEventRecord[]): PeakActivity {
  if (!events.length) {
    return {
      hourLabel: "No data yet",
      hourDetail: "Visits will appear here as traffic arrives.",
      weekdayLabel: "No data yet",
      weekdayDetail: "There is not enough traffic to find a peak day.",
    };
  }

  const hours = Array(24).fill(0) as number[];
  const days = Array(7).fill(0) as number[];
  for (const event of events) {
    if (!event.createdAt) continue;
    hours[event.createdAt.getUTCHours()] += 1;
    days[event.createdAt.getUTCDay()] += 1;
  }
  const hour = hours.indexOf(Math.max(...hours));
  const day = days.indexOf(Math.max(...days));
  return {
    hourLabel: `${String(hour).padStart(2, "0")}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`,
    hourDetail: `${formatNumber(hours[hour])} visits in the busiest hour`,
    weekdayLabel: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day],
    weekdayDetail: `${formatNumber(days[day])} visits on the strongest weekday`,
  };
}

function rate(numerator: number, denominator: number) {
  return denominator ? (numerator / denominator) * 100 : 0;
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatNumber(value: number) {
  return value.toLocaleString("en-US");
}

function startOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}
