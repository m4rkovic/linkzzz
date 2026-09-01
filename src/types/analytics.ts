export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "all";

export type AnalyticsMetricKey =
  | "visits"
  | "uniqueVisitors"
  | "linkClicks"
  | "ctr";

export type AnalyticsKpi = {
  key: AnalyticsMetricKey;
  label: string;
  value: string;
  change: string;
  positive: boolean;
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

export type TopLinkAnalytics = {
  name: string;
  url: string;
  clicks: number;
  percentage: number;
};

export type PeakActivity = {
  hourLabel: string;
  hourDetail: string;
  weekdayLabel: string;
  weekdayDetail: string;
};

export type AnalyticsSnapshot = {
  period: AnalyticsPeriod;
  kpis: AnalyticsKpi[];
  traffic: TrafficPoint[];
  topLinks: TopLinkAnalytics[];
  trafficSources: AnalyticsBreakdownItem[];
  countries: AnalyticsBreakdownItem[];
  cities: AnalyticsBreakdownItem[];
  devices: AnalyticsBreakdownItem[];
  browsers: AnalyticsBreakdownItem[];
  operatingSystems: AnalyticsBreakdownItem[];
  peakActivity: PeakActivity;
};
