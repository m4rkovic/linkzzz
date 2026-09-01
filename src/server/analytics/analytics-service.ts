import "server-only";

import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AnalyticsEventRecord } from "@/server/services/contracts";
import type { AnalyticsBreakdownItem, AnalyticsPeriod, AnalyticsSnapshot, TrafficPoint } from "@/types/analytics";

const PERIODS: AnalyticsPeriod[] = ["today", "7d", "30d", "90d", "all"];

export async function getAnalyticsSnapshots(userId: string): Promise<Record<AnalyticsPeriod, AnalyticsSnapshot>> {
  const repositories = await getServerDependencies();
  if (!repositories.analytics) throw new Error("Analytics persistence is unavailable.");
  const [events, profile] = await Promise.all([
    repositories.analytics.listForUser(userId),
    repositories.profiles.findByUserId(userId),
  ]);
  if (!profile) throw new Error("Profile not found.");
  return Object.fromEntries(PERIODS.map((period) => [period, snapshot(period, events, profile.links)])) as Record<AnalyticsPeriod, AnalyticsSnapshot>;
}

function snapshot(period: AnalyticsPeriod, allEvents: AnalyticsEventRecord[], links: { id: string; title: string; url: string }[]): AnalyticsSnapshot {
  const now = new Date();
  const start = periodStart(period, now);
  const events = allEvents.filter((event) => !start || (event.createdAt ?? now) >= start);
  const views = events.filter((event) => event.type === "PAGE_VIEW");
  const clicks = events.filter((event) => event.type === "LINK_CLICK");
  const unique = new Set(views.map((event) => event.visitorId).filter(Boolean)).size;
  const ctr = views.length ? clicks.length / views.length * 100 : 0;
  const previous = previousEvents(period, allEvents, start, now);
  const previousViews = previous.filter((event) => event.type === "PAGE_VIEW").length;
  const previousClicks = previous.filter((event) => event.type === "LINK_CLICK").length;
  const previousUnique = new Set(previous.filter((event) => event.type === "PAGE_VIEW").map((event) => event.visitorId).filter(Boolean)).size;
  const previousCtr = previousViews ? previousClicks / previousViews * 100 : 0;

  return {
    period,
    kpis: [
      kpi("visits", "Total Visits", views.length, change(views.length, previousViews)),
      kpi("uniqueVisitors", "Unique Visitors", unique, change(unique, previousUnique)),
      kpi("linkClicks", "Link Clicks", clicks.length, change(clicks.length, previousClicks)),
      kpi("ctr", "CTR", `${ctr.toFixed(1)}%`, `${(ctr - previousCtr).toFixed(1)}%`),
    ],
    traffic: traffic(period, events, now),
    topLinks: topLinks(clicks, links),
    trafficSources: breakdown(views, (event) => sourceName(event.referrer)),
    countries: breakdown(views, (event) => event.countryName || event.countryCode || "Unknown"),
    cities: breakdown(views, (event) => event.city || "Unknown"),
    devices: breakdown(views, (event) => event.device || "Unknown"),
    browsers: breakdown(views, (event) => event.browser || "Unknown"),
    operatingSystems: breakdown(views, (event) => event.os || "Unknown"),
    peakActivity: peak(views),
  };
}

function periodStart(period: AnalyticsPeriod, now: Date) {
  if (period === "all") return null;
  const result = new Date(now);
  if (period === "today") result.setHours(0, 0, 0, 0);
  else result.setDate(result.getDate() - Number(period.slice(0, -1)) + 1);
  return result;
}

function previousEvents(period: AnalyticsPeriod, events: AnalyticsEventRecord[], start: Date | null, now: Date) {
  if (!start || period === "all") return [];
  const duration = now.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - duration);
  return events.filter((event) => { const at = event.createdAt ?? now; return at >= previousStart && at < start; });
}

function kpi(key: "visits" | "uniqueVisitors" | "linkClicks" | "ctr", label: string, value: number | string, delta: string) {
  return { key, label, value: typeof value === "number" ? value.toLocaleString("en-US") : value, change: delta, positive: !delta.startsWith("-") };
}

function change(current: number, previous: number) {
  if (!previous) return current ? "+100.0%" : "0.0%";
  const value = (current - previous) / previous * 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function breakdown(events: AnalyticsEventRecord[], key: (event: AnalyticsEventRecord) => string): AnalyticsBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const event of events) counts.set(key(event), (counts.get(key(event)) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value: value.toLocaleString("en-US"), percentage: events.length ? Math.round(value / events.length * 100) : 0 }));
}

function sourceName(referrer?: string | null) {
  if (!referrer) return "Direct";
  try { return new URL(referrer).hostname.replace(/^www\./, ""); } catch { return "Other"; }
}

function topLinks(events: AnalyticsEventRecord[], links: { id: string; title: string; url: string }[]) {
  const counts = new Map<string, number>();
  for (const event of events) if (event.linkId) counts.set(event.linkId, (counts.get(event.linkId) ?? 0) + 1);
  const max = Math.max(0, ...counts.values());
  return links.map((link) => ({ name: link.title, url: hostname(link.url), clicks: counts.get(link.id) ?? 0, percentage: max ? Math.round((counts.get(link.id) ?? 0) / max * 100) : 0 })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
}

function hostname(url: string) { try { return new URL(url).hostname; } catch { return url; } }

function traffic(period: AnalyticsPeriod, events: AnalyticsEventRecord[], now: Date): TrafficPoint[] {
  const buckets = new Map<string, { visits: number; unique: Set<string>; clicks: number }>();
  for (const event of events) {
    const at = event.createdAt ?? now;
    const label = period === "today" ? `${String(at.getHours()).padStart(2, "0")}:00` : period === "all" ? at.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) : at.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    const bucket = buckets.get(label) ?? { visits: 0, unique: new Set<string>(), clicks: 0 };
    if (event.type === "PAGE_VIEW") { bucket.visits += 1; if (event.visitorId) bucket.unique.add(event.visitorId); }
    if (event.type === "LINK_CLICK") bucket.clicks += 1;
    buckets.set(label, bucket);
  }
  return [...buckets.entries()].map(([label, value]) => ({ label, visits: value.visits, unique: value.unique.size, clicks: value.clicks })).slice(-31);
}

function peak(events: AnalyticsEventRecord[]) {
  if (!events.length) return { hourLabel: "No data yet", hourDetail: "Visits will appear here.", weekdayLabel: "No data yet", weekdayDetail: "Keep sharing your profile." };
  const hours = Array(24).fill(0) as number[];
  const days = Array(7).fill(0) as number[];
  for (const event of events) { const at = event.createdAt ?? new Date(); hours[at.getHours()] += 1; days[at.getDay()] += 1; }
  const hour = hours.indexOf(Math.max(...hours));
  const day = days.indexOf(Math.max(...days));
  return { hourLabel: `${String(hour).padStart(2, "0")}:00 – ${String((hour + 1) % 24).padStart(2, "0")}:00`, hourDetail: `${hours[hour]} visits in the busiest hour`, weekdayLabel: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day], weekdayDetail: `${days[day]} visits on the strongest weekday` };
}
