import "server-only";

import { defaultAppearance } from "@/config/profile-defaults";
import { getPlanLinkLimit } from "@/server/business/plans";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { getAssetStorage } from "@/server/assets/storage-factory";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

export type UpdateProfileResult =
  | { ok: true; profile: PersistedProfileData; revision: number }
  | {
      ok: false;
      code:
        | "INVALID_PROFILE"
        | "SLUG_TAKEN"
        | "PROFILE_DISABLED"
        | "LINK_LIMIT_REACHED"
        | "PROFILE_CONFLICT"
        | "SUBSCRIPTION_MISSING";
      message: string;
    };

export async function getOrCreateProfileForUser(
  userId: string,
): Promise<PersistedProfileData | null> {
  return (await getOrCreateVersionedProfileForUser(userId))?.profile ?? null;
}

export async function getOrCreateVersionedProfileForUser(
  userId: string,
) {
  const dependencies = await getServerDependencies();
  const existing = await dependencies.profiles.findVersionedByUserId(userId);
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

  await dependencies.profiles.upsert(user.id, created);
  return dependencies.profiles.findVersionedByUserId(user.id);
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
  expectedRevision: number,
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
  const currentRecord = await dependencies.profiles.findVersionedByUserId(
    session.user.id,
  );
  const current = currentRecord?.profile ?? null;
  const incoming = validation.value;

  const assetReferences = collectAssetReferences(incoming);
  if (assetReferences.length) {
    if (!dependencies.assets) {
      return {
        ok: false,
        code: "INVALID_PROFILE",
        message: "Asset persistence is unavailable.",
      };
    }
    const ownedAssets = await dependencies.assets.findByIdsForUser(
      session.user.id,
      [...new Set(assetReferences.map((reference) => reference.id))],
    );
    const ownedById = new Map(ownedAssets.map((asset) => [asset.id, asset]));
    if (
      assetReferences.some(
        (reference) => ownedById.get(reference.id)?.type !== reference.type,
      )
    ) {
      return {
        ok: false,
        code: "INVALID_PROFILE",
        message: "One or more profile images are invalid.",
      };
    }
  }

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
  const writeResult = await dependencies.profiles.updateIfRevision(
    session.user.id,
    next,
    expectedRevision,
  );
  if (!writeResult.ok) {
    return {
      ok: false,
      code: "PROFILE_CONFLICT",
      message:
        "This profile changed in another tab. Reload the page before saving again.",
    };
  }
  const { profile: saved, revision } = writeResult;
  await cleanupReplacedAssets(session.user.id, current, saved, dependencies);

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

  return { ok: true, profile: saved, revision };
}

function collectAssetReferences(profile: PersistedProfileData) {
  const references: Array<{
    id: string;
    type: "AVATAR" | "COVER" | "LINK_IMAGE";
  }> = [];
  if (profile.avatarAssetId) {
    references.push({ id: profile.avatarAssetId, type: "AVATAR" });
  }
  if (profile.coverAssetId) {
    references.push({ id: profile.coverAssetId, type: "COVER" });
  }
  for (const link of profile.links) {
    if (link.imageAssetId) {
      references.push({ id: link.imageAssetId, type: "LINK_IMAGE" });
    }
  }
  return references;
}

async function cleanupReplacedAssets(
  userId: string,
  previous: PersistedProfileData | null,
  next: PersistedProfileData,
  dependencies: Awaited<ReturnType<typeof getServerDependencies>>,
) {
  if (!previous || !dependencies.assets) return;
  const previousIds = new Set(
    collectAssetReferences(previous).map((reference) => reference.id),
  );
  const nextIds = new Set(
    collectAssetReferences(next).map((reference) => reference.id),
  );
  const candidates = [...previousIds].filter((id) => !nextIds.has(id));
  if (!candidates.length) return;

  const removed = await dependencies.assets.deleteUnusedForUser(
    userId,
    candidates,
  );
  if (!removed.length) return;

  try {
    const storage = await getAssetStorage();
    await Promise.allSettled(
      removed.map((asset) => storage.remove(asset.storageKey)),
    );
  } catch {
    // The database no longer references these files. A storage sweep may retry later.
  }
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
