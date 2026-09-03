import "server-only";

import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import {
  CustomDomainError,
} from "@/server/domains/custom-domain-errors";
import {
  getRequestHostname,
  isApplicationHostname,
} from "@/server/domains/host-routing";
import {
  getCustomDomainRoutingTarget,
  normalizeCustomDomain,
} from "@/server/domains/custom-domain-validation";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { CustomDomainRecord } from "@/server/services/contracts";

export async function listCustomDomains(userId: string, smartLinkId: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) {
    throw new Error("Custom domain persistence is unavailable.");
  }
  return repositories.customDomains.listForSmartLink(userId, smartLinkId);
}

export async function resolveActiveCustomDomain(domain: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) return null;
  return repositories.customDomains.findActiveSlugByDomain(domain);
}

export async function isSmartLinkHostAllowed(headers: Headers, slug: string) {
  const host = getRequestHostname(headers);
  if (!host) return false;
  if (isApplicationHostname(host)) return true;
  return (await resolveActiveCustomDomain(host)) === slug;
}

export async function addCustomDomain(
  userId: string,
  smartLinkId: string,
  input: string,
) {
  const domain = parseCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) {
    throw new Error("Custom domain persistence is unavailable.");
  }
  await requireEditableSmartLink(repositories, userId, smartLinkId);

  const existing = await repositories.customDomains.findByDomain(domain);
  if (existing) {
    throw new CustomDomainError(
      "DOMAIN_ALREADY_CONNECTED",
      "This domain is already connected to a Smart Link.",
    );
  }

  let record: CustomDomainRecord;
  try {
    record = await repositories.customDomains.createForSmartLink(
      userId,
      smartLinkId,
      domain,
      randomBytes(24).toString("base64url"),
    );
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CustomDomainError(
        "DOMAIN_ALREADY_CONNECTED",
        "This domain is already connected to a Smart Link.",
      );
    }
    throw error;
  }

  await repositories.audit.write({
    actorUserId: userId,
    targetUserId: userId,
    action: "CUSTOM_DOMAIN_ADDED",
    resourceType: "CUSTOM_DOMAIN",
    resourceId: record.id,
    metadata: { domain, smartLinkId },
  });
  return record;
}

export async function verifyCustomDomain(
  userId: string,
  smartLinkId: string,
  input: string,
) {
  const domain = parseCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) {
    throw new Error("Custom domain persistence is unavailable.");
  }
  await requireEditableSmartLink(repositories, userId, smartLinkId);

  const owned = (await repositories.customDomains.listForSmartLink(userId, smartLinkId))
    .find((item) => item.domain === domain);
  if (!owned) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }

  let values: string[][];
  try {
    values = await resolveTxt(`_linkzzz-verification.${domain}`);
  } catch {
    throw new CustomDomainError(
      "DNS_RECORD_NOT_FOUND",
      "Verification TXT record was not found yet.",
    );
  }
  if (!values.some((parts) => parts.join("") === owned.verificationToken)) {
    throw new CustomDomainError(
      "DNS_RECORD_MISMATCH",
      "Verification TXT value does not match.",
    );
  }

  const nextStatus = owned.status === "ACTIVE" ? "ACTIVE" : "VERIFIED";
  const verified = await repositories.customDomains.setStatusForSmartLink(
    userId,
    smartLinkId,
    domain,
    nextStatus,
    new Date(),
  );
  if (!verified) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }

  await repositories.audit.write({
    actorUserId: userId,
    targetUserId: userId,
    action: "CUSTOM_DOMAIN_VERIFIED",
    resourceType: "CUSTOM_DOMAIN",
    resourceId: verified.id,
    metadata: { domain, smartLinkId },
  });
  return verified;
}

export async function setCustomDomainActive(
  userId: string,
  smartLinkId: string,
  input: string,
  active: boolean,
) {
  const domain = parseCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) {
    throw new Error("Custom domain persistence is unavailable.");
  }
  await requireEditableSmartLink(repositories, userId, smartLinkId);

  const owned = (await repositories.customDomains.listForSmartLink(userId, smartLinkId))
    .find((item) => item.domain === domain);
  if (!owned) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }
  if (active && !owned.verifiedAt) {
    throw new CustomDomainError(
      "DOMAIN_NOT_VERIFIED",
      "Verify the domain before activating it.",
    );
  }

  const updated = await repositories.customDomains.setStatusForSmartLink(
    userId,
    smartLinkId,
    domain,
    active ? "ACTIVE" : "DISABLED",
    owned.verifiedAt,
  );
  if (!updated) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }

  await repositories.audit.write({
    actorUserId: userId,
    targetUserId: userId,
    action: active ? "CUSTOM_DOMAIN_ACTIVATED" : "CUSTOM_DOMAIN_DISABLED",
    resourceType: "CUSTOM_DOMAIN",
    resourceId: updated.id,
    metadata: { domain, smartLinkId },
  });
  return updated;
}

export async function removeCustomDomain(
  userId: string,
  smartLinkId: string,
  input: string,
) {
  const domain = parseCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) {
    throw new Error("Custom domain persistence is unavailable.");
  }
  await requireEditableSmartLink(repositories, userId, smartLinkId);

  const owned = (await repositories.customDomains.listForSmartLink(userId, smartLinkId))
    .find((item) => item.domain === domain);
  if (!owned) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }

  const removed = await repositories.customDomains.deleteForSmartLink(
    userId,
    smartLinkId,
    domain,
  );
  if (!removed) {
    throw new CustomDomainError(
      "DOMAIN_NOT_FOUND",
      "Custom domain not found for this Smart Link.",
    );
  }

  await repositories.audit.write({
    actorUserId: userId,
    targetUserId: userId,
    action: "CUSTOM_DOMAIN_REMOVED",
    resourceType: "CUSTOM_DOMAIN",
    resourceId: owned.id,
    metadata: { domain, smartLinkId },
  });
}

async function requireEditableSmartLink(
  repositories: Awaited<ReturnType<typeof getServerDependencies>>,
  userId: string,
  smartLinkId: string,
) {
  const smartLink = await repositories.smartLinks.findByIdForUser(smartLinkId, userId);
  if (!smartLink) {
    throw new CustomDomainError("SMART_LINK_NOT_FOUND", "Smart Link not found.");
  }
  if (smartLink.status === "DISABLED") {
    throw new CustomDomainError(
      "SMART_LINK_DISABLED",
      "Disabled links cannot change custom domains.",
    );
  }
}

export function customDomainDnsInstructions(record: CustomDomainRecord) {
  return {
    verification: {
      type: "TXT" as const,
      name: `_linkzzz-verification.${record.domain}`,
      value: record.verificationToken,
    },
    routing: {
      type: "CNAME" as const,
      name: record.domain,
      value: getCustomDomainRoutingTarget(),
    },
  };
}

function parseCustomDomain(input: string) {
  try {
    return normalizeCustomDomain(input);
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomDomainError("INVALID_DOMAIN", error.message);
    }
    throw new CustomDomainError("INVALID_DOMAIN", "Enter a valid public domain.");
  }
}

function isPrismaUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002",
  );
}
