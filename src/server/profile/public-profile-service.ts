import "server-only";

import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { PersistedProfileData } from "@/types/persisted-profile";

export async function getPublicProfileForSmartLink(
  smartLinkId: string,
  userId: string,
): Promise<PersistedProfileData | null> {
  const dependencies = await getServerDependencies();
  const record = await dependencies.profiles.findVersionedBySmartLinkIdForUser(
    smartLinkId,
    userId,
  );
  if (!record || record.profile.status !== "PUBLISHED") return null;

  const [user, subscription] = await Promise.all([
    dependencies.users.findById(userId),
    dependencies.subscriptions.findByUserId(userId),
  ]);

  if (!user || user.role !== "CUSTOMER" || user.accountStatus !== "ACTIVE") {
    return null;
  }

  if (
    !subscription ||
    !getSubscriptionAccess(subscription.status, subscription.expiresAt).hasAccess
  ) {
    return null;
  }

  return record.profile;
}
