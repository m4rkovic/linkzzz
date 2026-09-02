import type { AnalyticsPeriod } from "@/types/analytics";

export const ANALYTICS_PERIODS: {
  value: AnalyticsPeriod;
  label: string;
  comparisonLabel: string;
}[] = [
  { value: "today", label: "Today", comparisonLabel: "vs yesterday so far" },
  { value: "7d", label: "7 days", comparisonLabel: "vs previous 7 days" },
  { value: "30d", label: "30 days", comparisonLabel: "vs previous 30 days" },
  { value: "90d", label: "90 days", comparisonLabel: "vs previous 90 days" },
  { value: "all", label: "All", comparisonLabel: "all-time" },
];
