import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  ANALYTICS_PERIOD_VALUES,
  getAnalyticsPeriodRange,
  getAnalyticsTrafficGranularity,
} from "@/features/analytics/analytics-period-ranges";
import type {
  AnalyticsBreakdownKind,
  AnalyticsPeriodSummary,
} from "@/features/analytics/analytics-summary-builder";
import type { AnalyticsPeriod } from "@/types/analytics";

type RawPeriodSummary = {
  currentVisits: number;
  currentUniqueVisitors: number;
  currentClicks: number;
  previousVisits: number;
  previousUniqueVisitors: number;
  previousClicks: number;
  traffic: unknown;
  linkPerformance: unknown;
  topCardClicks: unknown;
  breakdowns: unknown;
  peakHour: unknown;
  peakWeekday: unknown;
  deeplinkAttempts: number;
  deeplinkFallbacks: number;
  shieldBlocks: number;
  cardClicks: number;
  socialClicks: number;
  otherClicks: number;
  earliestHumanEventAt: Date | null;
};

type JsonTrafficPoint = {
  bucket: string;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
};

type JsonLinkPerformance = {
  smartLinkId: string;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
};

type JsonTopCard = { pageCardId: string; clicks: number };
type JsonBreakdown = {
  kind: AnalyticsBreakdownKind;
  name: string;
  count: number;
};
type JsonPeak = { value: number; count: number };

export async function queryAnalyticsPeriodSummaries(
  db: PrismaClient,
  userId: string,
  scopeSmartLinkId: string | undefined,
  now: Date,
): Promise<AnalyticsPeriodSummary[]> {
  return Promise.all(
    ANALYTICS_PERIOD_VALUES.map((period) =>
      queryPeriod(db, userId, scopeSmartLinkId, period, now),
    ),
  );
}

async function queryPeriod(
  db: PrismaClient,
  userId: string,
  scopeSmartLinkId: string | undefined,
  period: AnalyticsPeriod,
  now: Date,
): Promise<AnalyticsPeriodSummary> {
  const range = getAnalyticsPeriodRange(period, now);
  const queryStart = range.previousStart ?? range.start;
  const granularity = getAnalyticsTrafficGranularity(period);

  const rows = await db.$queryRaw<RawPeriodSummary[]>(Prisma.sql`
    WITH "scopedEvents" AS MATERIALIZED (
      SELECT event.*
      FROM "AnalyticsEvent" AS event
      INNER JOIN "SmartLink" AS link ON link."id" = event."smartLinkId"
      WHERE link."userId" = ${userId}
        AND (${scopeSmartLinkId ?? null}::text IS NULL OR link."id" = ${scopeSmartLinkId ?? null})
        AND event."createdAt" < ${range.end}
        AND (${queryStart}::timestamptz IS NULL OR event."createdAt" >= ${queryStart})
    ),
    "ranges"("window", "startAt", "endAt") AS (
      VALUES
        ('current'::text, ${range.start}::timestamptz, ${range.end}::timestamptz),
        ('previous'::text, ${range.previousStart}::timestamptz, ${range.previousEnd}::timestamptz)
    ),
    "windowEvents" AS MATERIALIZED (
      SELECT ranges."window", event.*
      FROM "ranges" AS ranges
      INNER JOIN "scopedEvents" AS event
        ON ranges."endAt" IS NOT NULL
       AND (ranges."startAt" IS NULL OR event."createdAt" >= ranges."startAt")
       AND event."createdAt" < ranges."endAt"
    ),
    "viewSources" AS (
      SELECT
        event."window",
        event."smartLinkId",
        BOOL_OR(event."type" = 'SMART_LINK_VIEW') AS "hasSmartView"
      FROM "windowEvents" AS event
      WHERE event."isBot" = FALSE
        AND event."type" IN ('SMART_LINK_VIEW', 'PAGE_VIEW')
      GROUP BY event."window", event."smartLinkId"
    ),
    "selectedViews" AS MATERIALIZED (
      SELECT event.*
      FROM "windowEvents" AS event
      INNER JOIN "viewSources" AS source
        ON source."window" = event."window"
       AND source."smartLinkId" = event."smartLinkId"
      WHERE event."isBot" = FALSE
        AND (
          event."type" = 'SMART_LINK_VIEW'
          OR (source."hasSmartView" = FALSE AND event."type" = 'PAGE_VIEW')
        )
    ),
    "humanEvents" AS MATERIALIZED (
      SELECT event.*
      FROM "windowEvents" AS event
      WHERE event."isBot" = FALSE
        AND event."type" <> 'BLOCKED_AUTOMATED_REQUEST'
    ),
    "viewTraffic" AS (
      SELECT
        date_trunc(${granularity}, view."createdAt", 'UTC') AS bucket,
        COUNT(*)::int AS visits,
        COUNT(DISTINCT view."visitorId")::int AS "uniqueVisitors"
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY bucket
    ),
    "clickTraffic" AS (
      SELECT
        date_trunc(${granularity}, event."createdAt", 'UTC') AS bucket,
        COUNT(*)::int AS clicks
      FROM "humanEvents" AS event
      WHERE event."window" = 'current'
        AND event."type" IN ('LINK_CLICK', 'SOCIAL_CLICK')
      GROUP BY bucket
    ),
    "traffic" AS (
      SELECT
        COALESCE(views.bucket, clicks.bucket) AS bucket,
        COALESCE(views.visits, 0)::int AS visits,
        COALESCE(views."uniqueVisitors", 0)::int AS "uniqueVisitors",
        COALESCE(clicks.clicks, 0)::int AS clicks
      FROM "viewTraffic" AS views
      FULL OUTER JOIN "clickTraffic" AS clicks ON clicks.bucket = views.bucket
    ),
    "linkViewCounts" AS (
      SELECT
        view."smartLinkId",
        COUNT(*)::int AS visits,
        COUNT(DISTINCT view."visitorId")::int AS "uniqueVisitors"
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY view."smartLinkId"
    ),
    "linkClickCounts" AS (
      SELECT event."smartLinkId", COUNT(*)::int AS clicks
      FROM "humanEvents" AS event
      WHERE event."window" = 'current'
        AND event."type" IN ('LINK_CLICK', 'SOCIAL_CLICK')
      GROUP BY event."smartLinkId"
    ),
    "linkPerformance" AS (
      SELECT
        COALESCE(views."smartLinkId", clicks."smartLinkId") AS "smartLinkId",
        COALESCE(views.visits, 0)::int AS visits,
        COALESCE(views."uniqueVisitors", 0)::int AS "uniqueVisitors",
        COALESCE(clicks.clicks, 0)::int AS clicks
      FROM "linkViewCounts" AS views
      FULL OUTER JOIN "linkClickCounts" AS clicks
        ON clicks."smartLinkId" = views."smartLinkId"
    ),
    "topCardClicks" AS (
      SELECT event."pageCardId", COUNT(*)::int AS clicks
      FROM "humanEvents" AS event
      WHERE event."window" = 'current'
        AND event."type" = 'LINK_CLICK'
        AND event."pageCardId" IS NOT NULL
      GROUP BY event."pageCardId"
      ORDER BY clicks DESC, event."pageCardId" ASC
      LIMIT 6
    ),
    "breakdownCounts" AS (
      SELECT
        'sources'::text AS kind,
        CASE
          WHEN view."referrer" IS NULL OR BTRIM(view."referrer") = '' THEN 'Direct'
          ELSE COALESCE(
            NULLIF(
              REGEXP_REPLACE(
                LOWER(SUBSTRING(view."referrer" FROM '^[[:alpha:]][[:alnum:]+.-]*://([^/:?#]+)')),
                '^www[.]',
                ''
              ),
              ''
            ),
            'Other'
          )
        END AS name,
        COUNT(*)::int AS count
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY name

      UNION ALL

      SELECT
        'countries'::text AS kind,
        COALESCE(NULLIF(view."countryName", ''), NULLIF(UPPER(view."countryCode"), ''), 'Unknown') AS name,
        COUNT(*)::int AS count
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY name

      UNION ALL

      SELECT 'devices'::text, COALESCE(NULLIF(view."device", ''), 'Unknown'), COUNT(*)::int
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY COALESCE(NULLIF(view."device", ''), 'Unknown')

      UNION ALL

      SELECT 'browsers'::text, COALESCE(NULLIF(view."browser", ''), 'Unknown'), COUNT(*)::int
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY COALESCE(NULLIF(view."browser", ''), 'Unknown')

      UNION ALL

      SELECT 'operatingSystems'::text, COALESCE(NULLIF(view."os", ''), 'Unknown'), COUNT(*)::int
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY COALESCE(NULLIF(view."os", ''), 'Unknown')
    ),
    "rankedBreakdowns" AS (
      SELECT
        breakdown.*,
        ROW_NUMBER() OVER (
          PARTITION BY breakdown.kind
          ORDER BY breakdown.count DESC, breakdown.name ASC
        ) AS rank
      FROM "breakdownCounts" AS breakdown
    ),
    "peakHours" AS (
      SELECT
        EXTRACT(HOUR FROM view."createdAt" AT TIME ZONE 'UTC')::int AS value,
        COUNT(*)::int AS count
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY value
    ),
    "peakWeekdays" AS (
      SELECT
        EXTRACT(DOW FROM view."createdAt" AT TIME ZONE 'UTC')::int AS value,
        COUNT(*)::int AS count
      FROM "selectedViews" AS view
      WHERE view."window" = 'current'
      GROUP BY value
    )
    SELECT
      (SELECT COUNT(*)::int FROM "selectedViews" WHERE "window" = 'current') AS "currentVisits",
      (SELECT COUNT(DISTINCT "visitorId")::int FROM "selectedViews" WHERE "window" = 'current') AS "currentUniqueVisitors",
      (SELECT COUNT(*)::int FROM "humanEvents" WHERE "window" = 'current' AND "type" IN ('LINK_CLICK', 'SOCIAL_CLICK')) AS "currentClicks",
      (SELECT COUNT(*)::int FROM "selectedViews" WHERE "window" = 'previous') AS "previousVisits",
      (SELECT COUNT(DISTINCT "visitorId")::int FROM "selectedViews" WHERE "window" = 'previous') AS "previousUniqueVisitors",
      (SELECT COUNT(*)::int FROM "humanEvents" WHERE "window" = 'previous' AND "type" IN ('LINK_CLICK', 'SOCIAL_CLICK')) AS "previousClicks",
      COALESCE((
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'bucket', traffic.bucket,
          'visits', traffic.visits,
          'uniqueVisitors', traffic."uniqueVisitors",
          'clicks', traffic.clicks
        ) ORDER BY traffic.bucket)
        FROM "traffic" AS traffic
      ), '[]'::jsonb) AS traffic,
      COALESCE((
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'smartLinkId', performance."smartLinkId",
          'visits', performance.visits,
          'uniqueVisitors', performance."uniqueVisitors",
          'clicks', performance.clicks
        ) ORDER BY performance."smartLinkId")
        FROM "linkPerformance" AS performance
      ), '[]'::jsonb) AS "linkPerformance",
      COALESCE((
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'pageCardId', card."pageCardId",
          'clicks', card.clicks
        ) ORDER BY card.clicks DESC, card."pageCardId" ASC)
        FROM "topCardClicks" AS card
      ), '[]'::jsonb) AS "topCardClicks",
      COALESCE((
        SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
          'kind', breakdown.kind,
          'name', breakdown.name,
          'count', breakdown.count
        ) ORDER BY breakdown.kind, breakdown.rank)
        FROM "rankedBreakdowns" AS breakdown
        WHERE breakdown.rank <= 6
      ), '[]'::jsonb) AS breakdowns,
      (
        SELECT JSONB_BUILD_OBJECT('value', peak.value, 'count', peak.count)
        FROM "peakHours" AS peak
        ORDER BY peak.count DESC, peak.value ASC
        LIMIT 1
      ) AS "peakHour",
      (
        SELECT JSONB_BUILD_OBJECT('value', peak.value, 'count', peak.count)
        FROM "peakWeekdays" AS peak
        ORDER BY peak.count DESC, peak.value ASC
        LIMIT 1
      ) AS "peakWeekday",
      (SELECT COUNT(*)::int FROM "windowEvents" WHERE "window" = 'current' AND "type" = 'DEEPLINK_ATTEMPT' AND "isBot" = FALSE) AS "deeplinkAttempts",
      (SELECT COUNT(*)::int FROM "windowEvents" WHERE "window" = 'current' AND "type" = 'DEEPLINK_FALLBACK' AND "isBot" = FALSE) AS "deeplinkFallbacks",
      (SELECT COUNT(*)::int FROM "windowEvents" WHERE "window" = 'current' AND "type" = 'BLOCKED_AUTOMATED_REQUEST') AS "shieldBlocks",
      (SELECT COUNT(*)::int FROM "humanEvents" WHERE "window" = 'current' AND "type" = 'LINK_CLICK' AND "pageCardId" IS NOT NULL) AS "cardClicks",
      (SELECT COUNT(*)::int FROM "humanEvents" WHERE "window" = 'current' AND "type" = 'SOCIAL_CLICK') AS "socialClicks",
      (SELECT COUNT(*)::int FROM "humanEvents" WHERE "window" = 'current' AND "type" = 'LINK_CLICK' AND "pageCardId" IS NULL) AS "otherClicks",
      (SELECT MIN("createdAt") FROM "humanEvents" WHERE "window" = 'current') AS "earliestHumanEventAt"
  `);

  const row = rows[0];
  if (!row) throw new Error(`Analytics query returned no ${period} summary.`);

  return {
    period,
    current: {
      visits: row.currentVisits,
      uniqueVisitors: row.currentUniqueVisitors,
      clicks: row.currentClicks,
    },
    previous: {
      visits: row.previousVisits,
      uniqueVisitors: row.previousUniqueVisitors,
      clicks: row.previousClicks,
    },
    traffic: jsonArray<JsonTrafficPoint>(row.traffic),
    linkPerformance: jsonArray<JsonLinkPerformance>(row.linkPerformance),
    topCardClicks: jsonArray<JsonTopCard>(row.topCardClicks),
    breakdowns: jsonArray<JsonBreakdown>(row.breakdowns),
    peakHour: jsonObject<JsonPeak>(row.peakHour),
    peakWeekday: jsonObject<JsonPeak>(row.peakWeekday),
    runtime: {
      deeplinkAttempts: row.deeplinkAttempts,
      deeplinkFallbacks: row.deeplinkFallbacks,
      shieldBlocks: row.shieldBlocks,
    },
    engagement: {
      cardClicks: row.cardClicks,
      socialClicks: row.socialClicks,
      otherClicks: row.otherClicks,
    },
    earliestHumanEventAt: row.earliestHumanEventAt?.toISOString() ?? null,
  };
}

function jsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function jsonObject<T>(value: unknown): T | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as T)
    : null;
}
