import "server-only";

import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AnalyticsDashboardData } from "@/types/analytics";

export async function getAnalyticsDashboard(userId: string): Promise<AnalyticsDashboardData> {
  const repositories = await getServerDependencies();
  if (!repositories.analytics) throw new Error("Analytics persistence is unavailable.");

  const dashboard = await repositories.analytics.getDashboardData(userId);
  if (!dashboard) throw new Error("Analytics dashboard could not be built.");
  return dashboard;
}

export async function getSmartLinkAnalyticsDashboard(
  userId: string,
  smartLinkId: string,
): Promise<AnalyticsDashboardData | null> {
  const repositories = await getServerDependencies();
  if (!repositories.analytics) throw new Error("Analytics persistence is unavailable.");

  return repositories.analytics.getDashboardData(userId, smartLinkId);
}
