import type { AnalyticsPeriod } from "@/types/analytics";

export const ANALYTICS_PERIOD_VALUES: AnalyticsPeriod[] = [
  "today",
  "7d",
  "30d",
  "90d",
  "all",
];

const DAY_MS = 86_400_000;

export type AnalyticsPeriodRange = {
  start: Date | null;
  end: Date;
  previousStart: Date | null;
  previousEnd: Date | null;
};

export function getAnalyticsPeriodRange(
  period: AnalyticsPeriod,
  now: Date,
): AnalyticsPeriodRange {
  if (period === "all") {
    return {
      start: null,
      end: now,
      previousStart: null,
      previousEnd: null,
    };
  }

  if (period === "today") {
    const start = startOfUtcDay(now);
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
  const start = startOfUtcDay(new Date(now.getTime() - (days - 1) * DAY_MS));
  const previousEnd = start;
  return {
    start,
    end: now,
    previousStart: new Date(start.getTime() - days * DAY_MS),
    previousEnd,
  };
}

export function getAnalyticsTrafficGranularity(period: AnalyticsPeriod) {
  if (period === "today") return "hour" as const;
  if (period === "all") return "month" as const;
  return "day" as const;
}

export function startOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}
