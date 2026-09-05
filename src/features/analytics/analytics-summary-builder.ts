import {
  ANALYTICS_PERIOD_VALUES,
  getAnalyticsPeriodRange,
  startOfUtcDay,
} from "@/features/analytics/analytics-period-ranges";
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
import type { AnalyticsSmartLinkRecord } from "@/server/services/contracts";

type PeriodCounts = {
  visits: number;
  uniqueVisitors: number;
  clicks: number;
};

export type AnalyticsBreakdownKind =
  | "sources"
  | "countries"
  | "devices"
  | "browsers"
  | "operatingSystems";

export type AnalyticsPeriodSummary = {
  period: AnalyticsPeriod;
  current: PeriodCounts;
  previous: PeriodCounts;
  traffic: Array<{
    bucket: string;
    visits: number;
    uniqueVisitors: number;
    clicks: number;
  }>;
  linkPerformance: Array<{
    smartLinkId: string;
    visits: number;
    uniqueVisitors: number;
    clicks: number;
  }>;
  topCardClicks: Array<{ pageCardId: string; clicks: number }>;
  breakdowns: Array<{
    kind: AnalyticsBreakdownKind;
    name: string;
    count: number;
  }>;
  peakHour: { value: number; count: number } | null;
  peakWeekday: { value: number; count: number } | null;
  runtime: {
    deeplinkAttempts: number;
    deeplinkFallbacks: number;
    shieldBlocks: number;
  };
  engagement: Omit<AnalyticsEngagement, "totalClicks">;
  earliestHumanEventAt: string | null;
};

const DAY_MS = 86_400_000;
const COUNTRY_NAMES = new Map<string, string>(
  LINK_GEO_COUNTRIES.map((country) => [country.code, country.name]),
);

export function buildAnalyticsDashboardFromSummaries(input: {
  summaries: AnalyticsPeriodSummary[];
  smartLinks: AnalyticsSmartLinkRecord[];
  scopeSmartLinkId?: string;
  now: Date;
}): AnalyticsDashboardData | null {
  const scope = input.scopeSmartLinkId
    ? input.smartLinks.find(
        (smartLink) => smartLink.id === input.scopeSmartLinkId,
      ) ?? null
    : null;

  if (input.scopeSmartLinkId && !scope) return null;

  const scopedLinks = scope ? [scope] : input.smartLinks;
  const summaries = new Map(
    input.summaries.map((summary) => [summary.period, summary]),
  );
  const snapshots = Object.fromEntries(
    ANALYTICS_PERIOD_VALUES.map((period) => {
      const summary = summaries.get(period);
      if (!summary) {
        throw new Error(`Analytics summary is missing period ${period}.`);
      }
      return [period, buildSnapshot(summary, scopedLinks, input.now)];
    }),
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
  summary: AnalyticsPeriodSummary,
  smartLinks: AnalyticsSmartLinkRecord[],
  now: Date,
): AnalyticsSnapshot {
  const ctr = rate(summary.current.clicks, summary.current.visits);
  const previousCtr = rate(summary.previous.clicks, summary.previous.visits);

  return {
    period: summary.period,
    kpis: [
      countKpi(
        "visits",
        "Visits",
        summary.current.visits,
        summary.previous.visits,
        summary.period,
      ),
      countKpi(
        "uniqueVisitors",
        "Unique visitors",
        summary.current.uniqueVisitors,
        summary.previous.uniqueVisitors,
        summary.period,
      ),
      countKpi(
        "linkClicks",
        "Clicks",
        summary.current.clicks,
        summary.previous.clicks,
        summary.period,
      ),
      rateKpi("ctr", "CTR", ctr, previousCtr, summary.period),
    ],
    traffic: buildTraffic(summary, now),
    linkPerformance: buildLinkPerformance(summary, smartLinks),
    topLinks: buildTopLinks(summary, smartLinks),
    trafficSources: buildBreakdown(summary, "sources"),
    countries: buildBreakdown(summary, "countries"),
    devices: buildBreakdown(summary, "devices"),
    browsers: buildBreakdown(summary, "browsers"),
    operatingSystems: buildBreakdown(summary, "operatingSystems"),
    peakActivity: buildPeakActivity(summary),
    runtime: buildRuntime(summary),
    engagement: {
      ...summary.engagement,
      totalClicks:
        summary.engagement.cardClicks +
        summary.engagement.socialClicks +
        summary.engagement.otherClicks,
    },
  };
}

function buildTraffic(
  summary: AnalyticsPeriodSummary,
  now: Date,
): TrafficPoint[] {
  const counts = new Map(
    summary.traffic.map((point) => [
      bucketKey(new Date(point.bucket), summary.period),
      point,
    ]),
  );

  if (summary.period === "today") {
    const start = startOfUtcDay(now);
    return Array.from({ length: now.getUTCHours() + 1 }, (_, hour) => {
      const bucket = new Date(start.getTime() + hour * 3_600_000);
      return trafficPoint(counts.get(bucketKey(bucket, summary.period)), `${String(hour).padStart(2, "0")}:00`);
    });
  }

  if (summary.period === "all") {
    const earliest = summary.earliestHumanEventAt
      ? new Date(summary.earliestHumanEventAt)
      : now;
    const cursor = new Date(
      Date.UTC(earliest.getUTCFullYear(), earliest.getUTCMonth(), 1),
    );
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const points: TrafficPoint[] = [];
    while (cursor <= last) {
      points.push(
        trafficPoint(
          counts.get(bucketKey(cursor, summary.period)),
          cursor.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          }),
        ),
      );
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return points;
  }

  const range = getAnalyticsPeriodRange(summary.period, now);
  const cursor = startOfUtcDay(range.start ?? now);
  const last = startOfUtcDay(now);
  const points: TrafficPoint[] = [];
  while (cursor <= last) {
    points.push(
      trafficPoint(
        counts.get(bucketKey(cursor, summary.period)),
        cursor.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
      ),
    );
    cursor.setTime(cursor.getTime() + DAY_MS);
  }
  return points;
}

function trafficPoint(
  value: AnalyticsPeriodSummary["traffic"][number] | undefined,
  label: string,
): TrafficPoint {
  return {
    label,
    visits: value?.visits ?? 0,
    unique: value?.uniqueVisitors ?? 0,
    clicks: value?.clicks ?? 0,
  };
}

function bucketKey(value: Date, period: AnalyticsPeriod) {
  if (period === "today") {
    return `${value.getUTCFullYear()}-${value.getUTCMonth()}-${value.getUTCDate()}-${value.getUTCHours()}`;
  }
  if (period === "all") {
    return `${value.getUTCFullYear()}-${value.getUTCMonth()}`;
  }
  return `${value.getUTCFullYear()}-${value.getUTCMonth()}-${value.getUTCDate()}`;
}

function buildLinkPerformance(
  summary: AnalyticsPeriodSummary,
  smartLinks: AnalyticsSmartLinkRecord[],
): SmartLinkAnalyticsItem[] {
  const counts = new Map(
    summary.linkPerformance.map((item) => [item.smartLinkId, item]),
  );

  return smartLinks
    .map((smartLink) => {
      const item = counts.get(smartLink.id);
      const visits = item?.visits ?? 0;
      const clicks = item?.clicks ?? 0;
      return {
        id: smartLink.id,
        title: smartLink.title,
        slug: smartLink.slug,
        type: smartLink.type,
        status: smartLink.status,
        visits,
        uniqueVisitors: item?.uniqueVisitors ?? 0,
        clicks,
        ctr: rate(clicks, visits),
      };
    })
    .sort(
      (a, b) =>
        b.visits - a.visits ||
        b.clicks - a.clicks ||
        a.title.localeCompare(b.title),
    );
}

function buildTopLinks(
  summary: AnalyticsPeriodSummary,
  smartLinks: AnalyticsSmartLinkRecord[],
): TopLinkAnalytics[] {
  const cards = new Map(
    smartLinks.flatMap((smartLink) =>
      smartLink.pageCards.map((card) => [
        card.id,
        { ...card, smartLinkTitle: smartLink.title },
      ] as const),
    ),
  );
  const clicks = summary.topCardClicks
    .map((item) => ({ item, card: cards.get(item.pageCardId) }))
    .filter(
      (entry): entry is {
        item: AnalyticsPeriodSummary["topCardClicks"][number];
        card: NonNullable<typeof entry.card>;
      } => Boolean(entry.card),
    );
  const max = Math.max(0, ...clicks.map((entry) => entry.item.clicks));

  return clicks.map(({ item, card }) => ({
    id: card.id,
    name: card.title,
    url: hostname(card.url),
    smartLinkTitle: card.smartLinkTitle,
    clicks: item.clicks,
    percentage: max ? Math.round((item.clicks / max) * 100) : 0,
  }));
}

function buildBreakdown(
  summary: AnalyticsPeriodSummary,
  kind: AnalyticsBreakdownKind,
): AnalyticsBreakdownItem[] {
  return summary.breakdowns
    .filter((item) => item.kind === kind)
    .map((item) => ({
      name: kind === "countries" ? countryName(item.name) : item.name,
      value: formatNumber(item.count),
      percentage: summary.current.visits
        ? Math.round((item.count / summary.current.visits) * 100)
        : 0,
    }));
}

function countryName(value: string) {
  const code = value.toUpperCase();
  return COUNTRY_NAMES.get(code) ?? value;
}

function buildPeakActivity(summary: AnalyticsPeriodSummary): PeakActivity {
  if (!summary.peakHour || !summary.peakWeekday) {
    return {
      hourLabel: "No data yet",
      hourDetail: "Visits will appear here as traffic arrives.",
      weekdayLabel: "No data yet",
      weekdayDetail: "There is not enough traffic to find a peak day.",
    };
  }

  const hour = summary.peakHour.value;
  const day = summary.peakWeekday.value;
  return {
    hourLabel: `${String(hour).padStart(2, "0")}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`,
    hourDetail: `${formatNumber(summary.peakHour.count)} visits in the busiest hour`,
    weekdayLabel: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][day],
    weekdayDetail: `${formatNumber(summary.peakWeekday.count)} visits on the strongest weekday`,
  };
}

function buildRuntime(summary: AnalyticsPeriodSummary): AnalyticsRuntimeHealth {
  return {
    ...summary.runtime,
    deeplinkFallbackRate: rate(
      summary.runtime.deeplinkFallbacks,
      summary.runtime.deeplinkAttempts,
    ),
  };
}

function countKpi(
  key: "visits" | "uniqueVisitors" | "linkClicks",
  label: string,
  current: number,
  previous: number,
  period: AnalyticsPeriod,
): AnalyticsKpi {
  if (period === "all") {
    return {
      key,
      label,
      value: formatNumber(current),
      change: "All time",
      trend: "none",
    };
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
    return {
      key,
      label,
      value: `${current.toFixed(1)}%`,
      change: "All time",
      trend: "none",
    };
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
    trend:
      value > 0 ? ("up" as const) : value < 0 ? ("down" as const) : ("flat" as const),
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
