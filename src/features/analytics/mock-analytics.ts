import type {
  AnalyticsBreakdownItem,
  AnalyticsKpi,
  AnalyticsPeriod,
  AnalyticsSnapshot,
  TopLinkAnalytics,
} from "@/types/analytics";

export const ANALYTICS_PERIODS: {
  value: AnalyticsPeriod;
  label: string;
  comparisonLabel: string;
}[] = [
    { value: "today", label: "Today", comparisonLabel: "vs yesterday" },
    { value: "7d", label: "7 days", comparisonLabel: "vs previous 7 days" },
    { value: "30d", label: "30 days", comparisonLabel: "vs previous 30 days" },
    { value: "90d", label: "90 days", comparisonLabel: "vs previous 90 days" },
    { value: "all", label: "All", comparisonLabel: "vs previous period" },
  ];

const baseTopLinks: TopLinkAnalytics[] = [
  { name: "Spotify", url: "open.spotify.com", clicks: 1482, percentage: 100 },
  { name: "Instagram", url: "instagram.com", clicks: 1034, percentage: 70 },
  { name: "YouTube", url: "youtube.com", clicks: 824, percentage: 56 },
  { name: "Official Website", url: "skyhook.rs", clicks: 611, percentage: 41 },
];

const trafficSources: AnalyticsBreakdownItem[] = [
  { name: "Direct", value: "5,182", percentage: 42 },
  { name: "Instagram", value: "3,121", percentage: 25 },
  { name: "Google", value: "1,872", percentage: 15 },
  { name: "TikTok", value: "1,248", percentage: 10 },
  { name: "Other", value: "1,059", percentage: 8 },
];

const countries: AnalyticsBreakdownItem[] = [
  { name: "Serbia", prefix: "🇷🇸", value: "6,842", percentage: 55 },
  { name: "Germany", prefix: "🇩🇪", value: "1,721", percentage: 14 },
  { name: "United States", prefix: "🇺🇸", value: "1,248", percentage: 10 },
  { name: "Austria", prefix: "🇦🇹", value: "873", percentage: 7 },
  { name: "Other", prefix: "🌍", value: "1,798", percentage: 14 },
];

const cities: AnalyticsBreakdownItem[] = [
  { name: "Belgrade", value: "2,314", percentage: 19 },
  { name: "Niš", value: "1,608", percentage: 13 },
  { name: "Novi Sad", value: "1,102", percentage: 9 },
  { name: "Vienna", value: "742", percentage: 6 },
  { name: "Berlin", value: "616", percentage: 5 },
];

const devices: AnalyticsBreakdownItem[] = [
  { name: "Mobile", value: "8,936", percentage: 72 },
  { name: "Desktop", value: "2,986", percentage: 24 },
  { name: "Tablet", value: "560", percentage: 4 },
];

const browsers: AnalyticsBreakdownItem[] = [
  { name: "Chrome", value: "5,493", percentage: 44 },
  { name: "Safari", value: "4,246", percentage: 34 },
  { name: "Firefox", value: "1,248", percentage: 10 },
  { name: "Edge", value: "874", percentage: 7 },
  { name: "Other", value: "621", percentage: 5 },
];

const operatingSystems: AnalyticsBreakdownItem[] = [
  { name: "iOS", value: "4,994", percentage: 40 },
  { name: "Android", value: "4,118", percentage: 33 },
  { name: "Windows", value: "2,247", percentage: 18 },
  { name: "macOS", value: "874", percentage: 7 },
  { name: "Other", value: "249", percentage: 2 },
];

const snapshots: Record<AnalyticsPeriod, AnalyticsSnapshot> = {
  today: {
    period: "today",
    kpis: createKpis("428", "319", "171", "40.0%", "+9.2%", "+7.4%", "+12.5%", "+1.2%"),
    traffic: [
      { label: "00", visits: 9, unique: 7, clicks: 3 },
      { label: "04", visits: 13, unique: 10, clicks: 4 },
      { label: "08", visits: 38, unique: 27, clicks: 13 },
      { label: "12", visits: 74, unique: 55, clicks: 30 },
      { label: "16", visits: 92, unique: 68, clicks: 39 },
      { label: "20", visits: 121, unique: 89, clicks: 52 },
      { label: "Now", visits: 81, unique: 63, clicks: 30 },
    ],
    topLinks: scaleLinks(baseTopLinks, 0.036),
    trafficSources: scaleBreakdownValues(trafficSources, 0.034),
    countries: scaleBreakdownValues(countries, 0.034),
    cities: scaleBreakdownValues(cities, 0.034),
    devices: scaleBreakdownValues(devices, 0.034),
    browsers: scaleBreakdownValues(browsers, 0.034),
    operatingSystems: scaleBreakdownValues(operatingSystems, 0.034),
    peakActivity: {
      hourLabel: "20:00 – 21:00",
      hourDetail: "48 visits in the busiest hour today",
      weekdayLabel: "Monday",
      weekdayDetail: "Current strongest weekday",
    },
  },
  "7d": {
    period: "7d",
    kpis: createKpis("3,146", "2,301", "1,224", "38.9%", "+14.8%", "+11.2%", "+17.6%", "+0.9%"),
    traffic: [
      { label: "Mon", visits: 382, unique: 281, clicks: 141 },
      { label: "Tue", visits: 417, unique: 304, clicks: 157 },
      { label: "Wed", visits: 391, unique: 286, clicks: 148 },
      { label: "Thu", visits: 468, unique: 340, clicks: 180 },
      { label: "Fri", visits: 511, unique: 371, clicks: 205 },
      { label: "Sat", visits: 548, unique: 401, clicks: 218 },
      { label: "Sun", visits: 429, unique: 318, clicks: 175 },
    ],
    topLinks: scaleLinks(baseTopLinks, 0.255),
    trafficSources: scaleBreakdownValues(trafficSources, 0.252),
    countries: scaleBreakdownValues(countries, 0.252),
    cities: scaleBreakdownValues(cities, 0.252),
    devices: scaleBreakdownValues(devices, 0.252),
    browsers: scaleBreakdownValues(browsers, 0.252),
    operatingSystems: scaleBreakdownValues(operatingSystems, 0.252),
    peakActivity: {
      hourLabel: "20:00 – 21:00",
      hourDetail: "11.8% of visits arrive in this hour",
      weekdayLabel: "Saturday",
      weekdayDetail: "17.4% of visits in the last 7 days",
    },
  },
  "30d": {
    period: "30d",
    kpis: createKpis("12,482", "8,921", "4,817", "38.6%", "+18.4%", "+12.7%", "+21.3%", "+2.4%"),
    traffic: [
      { label: "Aug 01", visits: 320, unique: 240, clicks: 115 },
      { label: "Aug 05", visits: 410, unique: 286, clicks: 152 },
      { label: "Aug 10", visits: 365, unique: 270, clicks: 143 },
      { label: "Aug 15", visits: 520, unique: 372, clicks: 214 },
      { label: "Aug 20", visits: 610, unique: 438, clicks: 252 },
      { label: "Aug 25", visits: 720, unique: 511, clicks: 290 },
      { label: "Aug 30", visits: 835, unique: 592, clicks: 337 },
    ],
    topLinks: baseTopLinks,
    trafficSources,
    countries,
    cities,
    devices,
    browsers,
    operatingSystems,
    peakActivity: {
      hourLabel: "20:00 – 21:00",
      hourDetail: "12.6% of visits arrive in this hour",
      weekdayLabel: "Friday",
      weekdayDetail: "16.9% of visits in the last 30 days",
    },
  },
  "90d": {
    period: "90d",
    kpis: createKpis("34,918", "24,706", "13,291", "38.1%", "+27.9%", "+22.3%", "+31.6%", "+1.1%"),
    traffic: [
      { label: "Jun 01", visits: 2780, unique: 1980, clicks: 1011 },
      { label: "Jun 15", visits: 3210, unique: 2240, clicks: 1180 },
      { label: "Jul 01", visits: 3440, unique: 2390, clicks: 1296 },
      { label: "Jul 15", visits: 3770, unique: 2660, clicks: 1452 },
      { label: "Aug 01", visits: 3980, unique: 2820, clicks: 1520 },
      { label: "Aug 15", visits: 4310, unique: 3040, clicks: 1650 },
      { label: "Aug 30", visits: 4690, unique: 3320, clicks: 1810 },
    ],
    topLinks: scaleLinks(baseTopLinks, 2.76),
    trafficSources: scaleBreakdownValues(trafficSources, 2.8),
    countries: scaleBreakdownValues(countries, 2.8),
    cities: scaleBreakdownValues(cities, 2.8),
    devices: scaleBreakdownValues(devices, 2.8),
    browsers: scaleBreakdownValues(browsers, 2.8),
    operatingSystems: scaleBreakdownValues(operatingSystems, 2.8),
    peakActivity: {
      hourLabel: "19:00 – 21:00",
      hourDetail: "The strongest two-hour window",
      weekdayLabel: "Friday",
      weekdayDetail: "17.8% of visits in the last 90 days",
    },
  },
  all: {
    period: "all",
    kpis: createKpis("87,641", "59,382", "32,994", "37.6%", "+41.2%", "+36.8%", "+44.1%", "+0.7%"),
    traffic: [
      { label: "Mar", visits: 6210, unique: 4310, clicks: 2220 },
      { label: "Apr", visits: 7540, unique: 5170, clicks: 2780 },
      { label: "May", visits: 8810, unique: 6020, clicks: 3270 },
      { label: "Jun", visits: 10120, unique: 6840, clicks: 3800 },
      { label: "Jul", visits: 11390, unique: 7710, clicks: 4320 },
      { label: "Aug", visits: 12482, unique: 8921, clicks: 4817 },
    ],
    topLinks: scaleLinks(baseTopLinks, 6.85),
    trafficSources: scaleBreakdownValues(trafficSources, 7.02),
    countries: scaleBreakdownValues(countries, 7.02),
    cities: scaleBreakdownValues(cities, 7.02),
    devices: scaleBreakdownValues(devices, 7.02),
    browsers: scaleBreakdownValues(browsers, 7.02),
    operatingSystems: scaleBreakdownValues(operatingSystems, 7.02),
    peakActivity: {
      hourLabel: "20:00 – 21:00",
      hourDetail: "Historically strongest hour",
      weekdayLabel: "Friday",
      weekdayDetail: "Historically strongest weekday",
    },
  },
};

export function getAnalyticsSnapshot(period: AnalyticsPeriod) {
  return snapshots[period];
}

function createKpis(
  visits: string,
  uniqueVisitors: string,
  linkClicks: string,
  ctr: string,
  visitsChange: string,
  uniqueChange: string,
  clicksChange: string,
  ctrChange: string,
): AnalyticsKpi[] {
  return [
    { key: "visits", label: "Total Visits", value: visits, change: visitsChange, positive: !visitsChange.startsWith("-") },
    { key: "uniqueVisitors", label: "Unique Visitors", value: uniqueVisitors, change: uniqueChange, positive: !uniqueChange.startsWith("-") },
    { key: "linkClicks", label: "Link Clicks", value: linkClicks, change: clicksChange, positive: !clicksChange.startsWith("-") },
    { key: "ctr", label: "CTR", value: ctr, change: ctrChange, positive: !ctrChange.startsWith("-") },
  ];
}

function scaleLinks(items: TopLinkAnalytics[], multiplier: number) {
  return items.map((item) => ({
    ...item,
    clicks: Math.max(1, Math.round(item.clicks * multiplier)),
  }));
}

function scaleBreakdownValues(items: AnalyticsBreakdownItem[], multiplier: number) {
  return items.map((item) => ({
    ...item,
    value: Math.max(1, Math.round(parseFormattedNumber(item.value) * multiplier)).toLocaleString("en-US"),
  }));
}

function parseFormattedNumber(value: string) {
  return Number(value.replaceAll(",", ""));
}
