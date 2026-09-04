import "server-only";

import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getPlanDefinition } from "@/features/plans/plan-catalog";
import {
  SMART_LINK_LIMIT_REASON,
  type SmartLinkLimitReason,
} from "@/server/business/plans";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { validateSlug } from "@/server/validation/slug";
import {
  validateDestinationConfig,
  validateSmartLinkEditable,
} from "@/server/smart-links/smart-link-validation";
import {
  buildDuplicateTitle,
  duplicateSlugCandidates,
} from "@/server/smart-links/smart-link-lifecycle";
import {
  DEFAULT_DEEPLINK_CONFIG,
  DEFAULT_GEO_CONFIG,
  DEFAULT_SHIELD_CONFIG,
  DEFAULT_TRACKING_CONFIG,
  type DestinationConfig,
  type SmartLinkRecord,
  type SmartLinkType,
} from "@/types/smart-link";

export type CreateSmartLinkInput = {
  type: SmartLinkType;
  title: string;
  slug: string;
  primaryDestination?: DestinationConfig;
};

export type CreateSmartLinkResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | {
      ok: false;
      code:
        | "INVALID_INPUT"
        | "SLUG_TAKEN"
        | SmartLinkLimitReason
        | "SUBSCRIPTION_INACTIVE";
      message: string;
    };

export type DuplicateSmartLinkResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "SMART_LINK_DISABLED"
        | SmartLinkLimitReason
        | "SUBSCRIPTION_INACTIVE"
        | "SLUG_TAKEN";
      message: string;
    };

export type UpdateSmartLinkResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | {
      ok: false;
      code:
        | "INVALID_INPUT"
        | "NOT_FOUND"
        | "SLUG_TAKEN"
        | "SMART_LINK_DISABLED"
        | "SMART_LINK_CONFLICT"
        | "SUBSCRIPTION_INACTIVE";
      message: string;
    };

export async function listOwnSmartLinks(session: AuthenticatedSession) {
  if (session.user.role !== "CUSTOMER") return [];
  const dependencies = await getServerDependencies();
  return dependencies.smartLinks.listForUser(session.user.id);
}

export async function getOwnSmartLink(
  session: AuthenticatedSession,
  id: string,
) {
  if (session.user.role !== "CUSTOMER") return null;
  const dependencies = await getServerDependencies();
  return dependencies.smartLinks.findByIdForUser(id, session.user.id);
}

export async function getPublicSmartLinkBySlug(slug: string) {
  const dependencies = await getServerDependencies();
  const smartLink = await dependencies.smartLinks.findBySlug(slug);
  if (!smartLink || smartLink.status !== "PUBLISHED") return null;

  const [user, subscription] = await Promise.all([
    dependencies.users.findById(smartLink.userId),
    dependencies.subscriptions.findByUserId(smartLink.userId),
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
  return smartLink;
}

export async function createOwnSmartLink(
  session: AuthenticatedSession,
  input: CreateSmartLinkInput,
): Promise<CreateSmartLinkResult> {
  if (session.user.role !== "CUSTOMER") {
    return invalidCreate("Only customer accounts can create links.");
  }

  const title = input.title.trim();
  if (!title || title.length > 120) {
    return invalidCreate("Link title must contain between 1 and 120 characters.");
  }

  const slug = validateSlug(input.slug);
  if (!slug.ok) return invalidCreate(slug.error);

  if (input.type === "DIRECT" && !input.primaryDestination) {
    return invalidCreate("A Direct Link requires a primary destination.");
  }

  const destination = input.primaryDestination
    ? validateDestinationConfig(input.primaryDestination)
    : { ok: true as const, value: undefined };
  if (!destination.ok) return invalidCreate(destination.message);

  const dependencies = await getServerDependencies();
  const existingSlug = await dependencies.smartLinks.findBySlug(slug.value);
  if (existingSlug) {
    return {
      ok: false,
      code: "SLUG_TAKEN",
      message: "This Smart Link URL is already in use.",
    };
  }

  const create = await dependencies.smartLinks.createWithinLimit({
    userId: session.user.id,
    type: input.type,
    title,
    slug: slug.value,
    status: "DRAFT",
    primaryDestination: destination.value,
    deeplink: structuredClone(DEFAULT_DEEPLINK_CONFIG),
    geo: structuredClone(DEFAULT_GEO_CONFIG),
    shield: structuredClone(DEFAULT_SHIELD_CONFIG),
    tracking: structuredClone(DEFAULT_TRACKING_CONFIG),
  });

  if (!create.ok) {
    if (create.reason === "SUBSCRIPTION_INACTIVE") {
      return {
        ok: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: "An active subscription is required to create a link.",
      };
    }
    return {
      ok: false,
      code: SMART_LINK_LIMIT_REASON,
      message: `Your ${getPlanDefinition(create.plan).name} plan allows up to ${create.limit} Smart Links.`,
    };
  }

  return { ok: true, smartLink: create.smartLink };
}

export async function updateOwnSmartLink(
  session: AuthenticatedSession,
  id: string,
  payload: unknown,
  expectedRevision: number,
): Promise<UpdateSmartLinkResult> {
  if (session.user.role !== "CUSTOMER") {
    return invalidUpdate("Customer account required.");
  }

  const dependencies = await getServerDependencies();
  const current = await dependencies.smartLinks.findByIdForUser(
    id,
    session.user.id,
  );
  if (!current) {
    return { ok: false, code: "NOT_FOUND", message: "Link not found." };
  }
  if (current.status === "DISABLED") {
    return {
      ok: false,
      code: "SMART_LINK_DISABLED",
      message: "This Smart Link is disabled and cannot be edited by the customer.",
    };
  }

  const validation = validateSmartLinkEditable(payload, current.type);
  if (!validation.ok) return invalidUpdate(validation.message);
  const editable = validation.value;

  const slugOwner = await dependencies.smartLinks.findBySlug(editable.slug);
  if (slugOwner && slugOwner.id !== current.id) {
    return {
      ok: false,
      code: "SLUG_TAKEN",
      message: "This Smart Link URL is already in use.",
    };
  }

  if (editable.status === "PUBLISHED") {
    const subscription = await dependencies.subscriptions.findByUserId(
      session.user.id,
    );
    if (
      !subscription ||
      !getSubscriptionAccess(subscription.status, subscription.expiresAt).hasAccess
    ) {
      return {
        ok: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: "An active subscription is required to publish a link.",
      };
    }
  }

  const write = await dependencies.smartLinks.updateIfRevision(
    id,
    session.user.id,
    editable,
    expectedRevision,
  );
  if (!write.ok) {
    return {
      ok: false,
      code: "SMART_LINK_CONFLICT",
      message: "This Smart Link changed in another tab. Reload before saving again.",
    };
  }

  if (current.slug !== write.smartLink.slug) {
    await dependencies.audit.write({
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      action: "SMART_LINK_SLUG_CHANGED",
      resourceType: "SMART_LINK",
      resourceId: write.smartLink.id,
      metadata: {
        title: write.smartLink.title,
        previousSlug: current.slug,
        nextSlug: write.smartLink.slug,
      },
    });
  }

  if (current.status !== write.smartLink.status) {
    await dependencies.audit.write({
      actorUserId: session.user.id,
      targetUserId: session.user.id,
      action:
        write.smartLink.status === "PUBLISHED"
          ? "SMART_LINK_PUBLISHED"
          : "SMART_LINK_UNPUBLISHED",
      resourceType: "SMART_LINK",
      resourceId: write.smartLink.id,
      metadata: { title: write.smartLink.title, slug: write.smartLink.slug },
    });
  }

  await dependencies.audit.write({
    actorUserId: session.user.id,
    targetUserId: session.user.id,
    action: "SMART_LINK_UPDATED",
    resourceType: "SMART_LINK",
    resourceId: write.smartLink.id,
    metadata: { title: write.smartLink.title, slug: write.smartLink.slug },
  });

  return { ok: true, smartLink: write.smartLink };
}

export async function duplicateOwnSmartLink(
  session: AuthenticatedSession,
  id: string,
): Promise<DuplicateSmartLinkResult> {
  if (session.user.role !== "CUSTOMER") {
    return { ok: false, code: "NOT_FOUND", message: "Link not found." };
  }

  const dependencies = await getServerDependencies();
  const source = await dependencies.smartLinks.findByIdForUser(id, session.user.id);
  if (!source) {
    return { ok: false, code: "NOT_FOUND", message: "Link not found." };
  }
  if (source.status === "DISABLED") {
    return { ok: false, code: "SMART_LINK_DISABLED", message: "Disabled links cannot be duplicated." };
  }

  let slug: string | null = null;
  for (const candidate of duplicateSlugCandidates(source.slug)) {
    if (!(await dependencies.smartLinks.findBySlug(candidate))) {
      slug = candidate;
      break;
    }
  }
  if (!slug) {
    return { ok: false, code: "SLUG_TAKEN", message: "Could not allocate a unique URL for the duplicate." };
  }

  const duplicate = await dependencies.smartLinks.duplicateForUserWithinLimit(
    source.id,
    session.user.id,
    buildDuplicateTitle(source.title),
    slug,
  );
  if (!duplicate.ok) {
    if (duplicate.reason === "SUBSCRIPTION_INACTIVE") {
      return {
        ok: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: "An active subscription is required to duplicate a link.",
      };
    }
    if (duplicate.reason === SMART_LINK_LIMIT_REASON) {
      return {
        ok: false,
        code: SMART_LINK_LIMIT_REASON,
        message: `Your ${getPlanDefinition(duplicate.plan).name} plan allows up to ${duplicate.limit} Smart Links.`,
      };
    }
    if (duplicate.reason === "SMART_LINK_DISABLED") {
      return {
        ok: false,
        code: "SMART_LINK_DISABLED",
        message: "Disabled links cannot be duplicated.",
      };
    }
    return { ok: false, code: "NOT_FOUND", message: "Link not found." };
  }

  await dependencies.audit.write({
    actorUserId: session.user.id,
    targetUserId: session.user.id,
    action: "SMART_LINK_DUPLICATED",
    resourceType: "SMART_LINK",
    resourceId: duplicate.smartLink.id,
    metadata: { sourceSmartLinkId: source.id },
  });
  return { ok: true, smartLink: duplicate.smartLink };
}

function invalidCreate(message: string): CreateSmartLinkResult {
  return { ok: false, code: "INVALID_INPUT", message };
}

function invalidUpdate(message: string): UpdateSmartLinkResult {
  return { ok: false, code: "INVALID_INPUT", message };
}
