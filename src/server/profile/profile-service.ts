import "server-only";

import { defaultAppearance } from "@/config/profile-defaults";
import { getPlanLinkLimit } from "@/server/business/plans";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

export type UpdateProfileResult =
  | { ok: true; profile: PersistedProfileData }
  | {
      ok: false;
      code:
        | "INVALID_PROFILE"
        | "SLUG_TAKEN"
        | "PROFILE_DISABLED"
        | "LINK_LIMIT_REACHED"
        | "SUBSCRIPTION_MISSING";
      message: string;
    };

export async function getOrCreateProfileForUser(
  userId: string,
): Promise<PersistedProfileData | null> {
  const dependencies = await getServerDependencies();
  const existing = await dependencies.profiles.findByUserId(userId);
  if (existing) return existing;

  const user = await dependencies.users.findById(userId);
  if (!user || user.role !== "CUSTOMER") return null;

  const created: PersistedProfileData = {
    slug: user.username,
    username: user.username,
    displayName: user.username,
    bio: "",
    status: "DRAFT",
    stats: [],
    socials: [],
    links: [],
    appearance: structuredClone(defaultAppearance),
  };

  return dependencies.profiles.upsert(user.id, created);
}

export async function getProfileBySlug(
  slug: string,
): Promise<PersistedProfileData | null> {
  const dependencies = await getServerDependencies();
  const record = await dependencies.profiles.findBySlug(slug);
  return record?.profile ?? null;
}

export async function getPublicProfileBySlug(
  slug: string,
): Promise<PersistedProfileData | null> {
  const dependencies = await getServerDependencies();
  const record = await dependencies.profiles.findBySlug(slug);
  if (!record || record.profile.status !== "PUBLISHED") return null;

  const [user, subscription] = await Promise.all([
    dependencies.users.findById(record.userId),
    dependencies.subscriptions.findByUserId(record.userId),
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

export async function updateOwnProfile(
  session: AuthenticatedSession,
  payload: unknown,
): Promise<UpdateProfileResult> {
  const validation = validateProfilePayload(payload);
  if (!validation.ok) {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: validation.error,
    };
  }

  const dependencies = await getServerDependencies();
  const current = await dependencies.profiles.findByUserId(session.user.id);
  const incoming = validation.value;

  if (current?.status === "DISABLED") {
    return {
      ok: false,
      code: "PROFILE_DISABLED",
      message: "This profile is disabled by an administrator.",
    };
  }

  if (incoming.status === "DISABLED") {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: "Customers cannot disable profiles administratively.",
    };
  }

  const slugOwner = await dependencies.profiles.findBySlug(incoming.slug);
  if (slugOwner && slugOwner.userId !== session.user.id) {
    return {
      ok: false,
      code: "SLUG_TAKEN",
      message: "This profile URL is already in use.",
    };
  }

  const subscription = await dependencies.subscriptions.findByUserId(
    session.user.id,
  );
  if (!subscription) {
    return {
      ok: false,
      code: "SUBSCRIPTION_MISSING",
      message: "Subscription information is missing.",
    };
  }

  const previousCount = current?.links.length ?? 0;
  const nextCount = incoming.links.length;
  const linkLimit = getPlanLinkLimit(subscription.plan);

  if (nextCount > previousCount && nextCount > linkLimit) {
    return {
      ok: false,
      code: "LINK_LIMIT_REACHED",
      message: `Your ${subscription.plan} plan allows up to ${linkLimit} links.`,
    };
  }

  const next = preserveUnpersistedMedia(incoming, current);
  const saved = await dependencies.profiles.upsert(session.user.id, next);

  if (current?.slug !== saved.slug) {
    await dependencies.audit.write({
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      action: "SLUG_CHANGED",
      resourceType: "PROFILE",
      resourceId: session.user.id,
      metadata: {
        previousSlug: current?.slug ?? null,
        nextSlug: saved.slug,
      },
    });
  }

  if (current?.status !== saved.status) {
    await dependencies.audit.write({
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      action:
        saved.status === "PUBLISHED"
          ? "PROFILE_PUBLISHED"
          : "PROFILE_UNPUBLISHED",
      resourceType: "PROFILE",
      resourceId: session.user.id,
    });
  }

  await dependencies.audit.write({
    actorUserId: session.user.id,
    targetUserId: session.user.id,
    action: "PROFILE_UPDATED",
    resourceType: "PROFILE",
    resourceId: session.user.id,
  });

  return { ok: true, profile: saved };
}

function preserveUnpersistedMedia(
  incoming: PersistedProfileData,
  current: PersistedProfileData | null,
): PersistedProfileData {
  const currentLinks = new Map(current?.links.map((link) => [link.id, link]));

  return {
    ...incoming,
    avatarUrl: resolveMediaUrl(incoming.avatarUrl, current?.avatarUrl),
    coverImageUrl: resolveMediaUrl(incoming.coverImageUrl, current?.coverImageUrl),
    links: incoming.links.map((link) => ({
      ...link,
      imageUrl: resolveMediaUrl(
        link.imageUrl,
        currentLinks.get(link.id)?.imageUrl,
      ),
    })),
  };
}

function resolveMediaUrl(
  incoming: string | undefined,
  current: string | undefined,
) {
  if (incoming?.startsWith("blob:")) return current;
  return incoming;
}
