import "server-only";

import { buildAnalyticsDashboardData } from "@/features/analytics/analytics-aggregator";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AnalyticsDashboardData } from "@/types/analytics";

export async function getAnalyticsDashboard(userId: string): Promise<AnalyticsDashboardData> {
  const repositories = await getServerDependencies();
  if (!repositories.analytics) throw new Error("Analytics persistence is unavailable.");

  const [events, smartLinks] = await Promise.all([
    repositories.analytics.listForUser(userId),
    repositories.analytics.listSmartLinksForUser(userId),
  ]);

  return buildAnalyticsDashboardData({ events, smartLinks })!;
}

export async function getSmartLinkAnalyticsDashboard(
  userId: string,
  smartLinkId: string,
): Promise<AnalyticsDashboardData | null> {
  const repositories = await getServerDependencies();
  if (!repositories.analytics) throw new Error("Analytics persistence is unavailable.");

  const [events, smartLinks] = await Promise.all([
    repositories.analytics.listForUser(userId),
    repositories.analytics.listSmartLinksForUser(userId),
  ]);

  return buildAnalyticsDashboardData({
    events,
    smartLinks,
    scopeSmartLinkId: smartLinkId,
  });
}
