import { redirect } from "next/navigation";

import SmartLinksManager from "@/components/smart-links/smart-links-manager";
import { buildSmartLinkDashboardMetrics } from "@/features/smart-links/dashboard-metrics";
import { getCurrentSession } from "@/server/auth/current-session";
import { getSmartLinkLimit } from "@/server/business/plans";
import { getServerDependencies } from "@/server/persistence/dependencies";

export default async function SmartLinksPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const dependencies = await getServerDependencies();
  const [smartLinks, subscription, analyticsEvents] = await Promise.all([
    dependencies.smartLinks.listForUser(session.user.id),
    dependencies.subscriptions.findByUserId(session.user.id),
    dependencies.analytics?.listForUser(session.user.id) ?? Promise.resolve([]),
  ]);
  const limit = subscription ? getSmartLinkLimit(subscription.plan) : 0;
  const metrics = buildSmartLinkDashboardMetrics(analyticsEvents);

  return (
    <SmartLinksManager
      initialLinks={smartLinks.map((smartLink) => ({
        id: smartLink.id,
        type: smartLink.type,
        title: smartLink.title,
        slug: smartLink.slug,
        status: smartLink.status,
        destinationUrl: smartLink.primaryDestination?.url,
        provider: smartLink.primaryDestination?.provider,
        shieldEnabled: smartLink.shield.enabled,
        views: metrics.get(smartLink.id)?.views ?? 0,
        clicks: metrics.get(smartLink.id)?.clicks ?? 0,
        createdAt: smartLink.createdAt.toISOString(),
        revision: smartLink.revision,
        updatedAt: smartLink.updatedAt.toISOString(),
      }))}
      plan={subscription?.plan ?? null}
      limit={limit}
    />
  );
}
