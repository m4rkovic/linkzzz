import "server-only";

import type { AccountSummary } from "@/features/account/account-types";
import { getServerDependencies } from "@/server/persistence/dependencies";

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export async function getAccountSummary(
  userId: string,
): Promise<AccountSummary | null> {
  const dependencies = await getServerDependencies();
  const [user, subscription, smartLinkCount] = await Promise.all([
    dependencies.users.findById(userId),
    dependencies.subscriptions.findByUserId(userId),
    dependencies.smartLinks.countForUser(userId),
  ]);

  if (!user || !subscription) return null;

  const expiresAt = subscription.expiresAt;
  const effectiveStatus =
    expiresAt &&
    expiresAt.getTime() < Date.now() &&
    subscription.status !== "STOPPED"
      ? "EXPIRED"
      : subscription.status;

  return {
    username: user.username,
    email: user.email,
    plan: subscription.plan,
    subscriptionStatus: effectiveStatus,
    periodLabel: expiresAt
      ? `${shortDateFormatter.format(subscription.startedAt)} – ${shortDateFormatter.format(expiresAt)}`
      : `Since ${shortDateFormatter.format(subscription.startedAt)}`,
    expiresLabel: expiresAt ? longDateFormatter.format(expiresAt) : "No expiry date",
    autoRenew: subscription.autoRenew,
    linksUsed: smartLinkCount,
  };
}
