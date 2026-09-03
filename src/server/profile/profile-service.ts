import "server-only";

import { defaultAppearance } from "@/config/profile-defaults";
import { canSavePageCards } from "@/server/business/plans";
import { getPlanDefinition } from "@/features/plans/plan-catalog";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import {
  cleanupReplacedProfileAssets,
  cleanupReplacedSmartLinkAssets,
  collectProfileAssetReferences,
  preserveUnpersistedProfileMedia,
} from "@/server/profile/profile-media";
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
    contentBlocks: [],
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

export async function getVersionedPageForSmartLink(
  session: AuthenticatedSession,
  smartLinkId: string,
) {
  if (session.user.role !== "CUSTOMER") return null;
  const dependencies = await getServerDependencies();
  const smartLink = await dependencies.smartLinks.findByIdForUser(
    smartLinkId,
    session.user.id,
  );
  if (!smartLink || smartLink.type !== "LANDING_PAGE") return null;
  return dependencies.profiles.findVersionedBySmartLinkIdForUser(
    smartLinkId,
    session.user.id,
  );
}

export async function updateOwnSmartLinkPage(
  session: AuthenticatedSession,
  smartLinkId: string,
  payload: unknown,
  expectedRevision: number,
): Promise<UpdateProfileResult> {
  if (session.user.role !== "CUSTOMER") {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: "Customer account required.",
    };
  }

  const dependencies = await getServerDependencies();
  const smartLink = await dependencies.smartLinks.findByIdForUser(
    smartLinkId,
    session.user.id,
  );
  if (!smartLink || smartLink.type !== "LANDING_PAGE") {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: "Landing Page link not found.",
    };
  }
  if (smartLink.status === "DISABLED") {
    return {
      ok: false,
      code: "PROFILE_DISABLED",
      message: "This link is disabled by an administrator.",
    };
  }

  const currentRecord =
    await dependencies.profiles.findVersionedBySmartLinkIdForUser(
      smartLinkId,
      session.user.id,
    );
  if (!currentRecord) {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: "Landing page content was not found.",
    };
  }

  // The Page endpoint owns page content only. Slug and publish status belong to
  // the parent SmartLink and are deliberately preserved here even if a stale
  // client sends different values.
  const normalizedPayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? {
          ...(payload as Record<string, unknown>),
          slug: smartLink.slug,
          status: smartLink.status,
        }
      : payload;

  const validation = validateProfilePayload(normalizedPayload);
  if (!validation.ok) {
    return {
      ok: false,
      code: "INVALID_PROFILE",
      message: validation.error,
    };
  }

  const current = currentRecord.profile;
  const incoming = validation.value;
  const assetReferences = collectProfileAssetReferences(incoming);
  if (assetReferences.length) {
    if (!dependencies.assets) {
      return {
        ok: false,
        code: "INVALID_PROFILE",
        message: "Asset persistence is unavailable.",
      };
    }
    const ownedAssets = await dependencies.assets.findByIdsForSmartLink(
      session.user.id,
      smartLinkId,
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
        message: "One or more page images do not belong to this link.",
      };
    }
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

  const pageCardDecision = canSavePageCards(
    subscription.plan,
    current.links.length,
    incoming.links.length,
  );
  if (!pageCardDecision.allowed) {
    return {
      ok: false,
      code: "LINK_LIMIT_REACHED",
      message: `Your ${getPlanDefinition(subscription.plan).name} plan allows up to ${pageCardDecision.limit} links on one Landing Page.`,
    };
  }

  const next = preserveUnpersistedProfileMedia(incoming, current);
  const writeResult = await dependencies.profiles.updateForSmartLinkIfRevision(
    smartLinkId,
    session.user.id,
    next,
    expectedRevision,
  );
  if (!writeResult.ok) {
    return {
      ok: false,
      code: "PROFILE_CONFLICT",
      message:
        "This page changed in another tab. Reload the page before saving again.",
    };
  }

  const { profile: saved, revision } = writeResult;
  await cleanupReplacedSmartLinkAssets(
    session.user.id,
    smartLinkId,
    current,
    saved,
    dependencies,
  );

  await dependencies.audit.write({
    actorUserId: session.user.id,
    targetUserId: session.user.id,
    action: "PROFILE_UPDATED",
    resourceType: "PROFILE",
    resourceId: smartLinkId,
  });

  return { ok: true, profile: saved, revision };
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

  const assetReferences = collectProfileAssetReferences(incoming);
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

  const pageCardDecision = canSavePageCards(
    subscription.plan,
    current?.links.length ?? 0,
    incoming.links.length,
  );
  if (!pageCardDecision.allowed) {
    return {
      ok: false,
      code: "LINK_LIMIT_REACHED",
      message: `Your ${getPlanDefinition(subscription.plan).name} plan allows up to ${pageCardDecision.limit} links on one Landing Page.`,
    };
  }

  const next = preserveUnpersistedProfileMedia(incoming, current);
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
  await cleanupReplacedProfileAssets(session.user.id, current, saved, dependencies);

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
