import type { SmartLinkStatus, SmartLinkType } from "@/types/smart-link";

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "all";

export type AnalyticsMetricKey =
  | "visits"
  | "uniqueVisitors"
  | "linkClicks"
  | "ctr";

export type AnalyticsTrend = "up" | "down" | "flat" | "none";

export type AnalyticsKpi = {
  key: AnalyticsMetricKey;
  label: string;
  value: string;
  change: string;
  trend: AnalyticsTrend;
};

export type TrafficPoint = {
  label: string;
  visits: number;
  unique: number;
  clicks: number;
};

export type AnalyticsBreakdownItem = {
  name: string;
  value: string;
  percentage: number;
  prefix?: string;
};

export type SmartLinkAnalyticsItem = {
  id: string;
  title: string;
  slug: string;
  type: SmartLinkType;
  status: SmartLinkStatus;
  visits: number;
  uniqueVisitors: number;
  clicks: number;
  ctr: number;
};

export type TopLinkAnalytics = {
  id: string;
  name: string;
  url: string;
  smartLinkTitle: string;
  clicks: number;
  percentage: number;
};

export type PeakActivity = {
  hourLabel: string;
  hourDetail: string;
  weekdayLabel: string;
  weekdayDetail: string;
};

export type AnalyticsRuntimeHealth = {
  deeplinkAttempts: number;
  deeplinkFallbacks: number;
  deeplinkFallbackRate: number;
  shieldBlocks: number;
};

export type AnalyticsEngagement = {
  cardClicks: number;
  socialClicks: number;
  otherClicks: number;
  totalClicks: number;
};

export type AnalyticsScope = {
  id: string;
  title: string;
  slug: string;
  type: SmartLinkType;
  status: SmartLinkStatus;
};

export type AnalyticsSnapshot = {
  period: AnalyticsPeriod;
  kpis: AnalyticsKpi[];
  traffic: TrafficPoint[];
  linkPerformance: SmartLinkAnalyticsItem[];
  topLinks: TopLinkAnalytics[];
  trafficSources: AnalyticsBreakdownItem[];
  countries: AnalyticsBreakdownItem[];
  devices: AnalyticsBreakdownItem[];
  browsers: AnalyticsBreakdownItem[];
  operatingSystems: AnalyticsBreakdownItem[];
  peakActivity: PeakActivity;
  runtime: AnalyticsRuntimeHealth;
  engagement: AnalyticsEngagement;
};

export type AnalyticsDashboardData = {
  snapshots: Record<AnalyticsPeriod, AnalyticsSnapshot>;
  scope: AnalyticsScope | null;
};
