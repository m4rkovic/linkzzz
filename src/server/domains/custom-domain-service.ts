import "server-only";

import { randomBytes } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import { getCustomDomainRoutingTarget, normalizeCustomDomain } from "@/server/domains/custom-domain-validation";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { CustomDomainRecord } from "@/server/services/contracts";

export async function listCustomDomains(userId: string, smartLinkId: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  return repositories.customDomains.listForSmartLink(userId, smartLinkId);
}

export async function resolveActiveCustomDomain(domain: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) return null;
  return repositories.customDomains.findActiveSlugByDomain(domain);
}

export async function addCustomDomain(userId: string, smartLinkId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  await requireEditableSmartLink(repositories, userId, smartLinkId);
  const existing = await repositories.customDomains.findByDomain(domain);
  if (existing) throw new Error("This domain is already connected to a SmartLink.");
  const record = await repositories.customDomains.createForSmartLink(userId, smartLinkId, domain, randomBytes(24).toString("base64url"));
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_ADDED", resourceType: "SMART_LINK", resourceId: smartLinkId, metadata: { domain } });
  return record;
}

export async function verifyCustomDomain(userId: string, smartLinkId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  await requireEditableSmartLink(repositories, userId, smartLinkId);
  const owned = (await repositories.customDomains.listForSmartLink(userId, smartLinkId)).find((item) => item.domain === domain);
  if (!owned) throw new Error("Custom domain not found for this SmartLink.");
  let values: string[][];
  try { values = await resolveTxt(`_linkzzz-verification.${domain}`); }
  catch { throw new Error("Verification TXT record was not found yet."); }
  if (!values.some((parts) => parts.join("") === owned.verificationToken)) throw new Error("Verification TXT value does not match.");
  const verified = await repositories.customDomains.setStatusForSmartLink(userId, smartLinkId, domain, "VERIFIED", new Date());
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_VERIFIED", resourceType: "SMART_LINK", resourceId: smartLinkId, metadata: { domain } });
  return verified!;
}

export async function setCustomDomainActive(userId: string, smartLinkId: string, input: string, active: boolean) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  await requireEditableSmartLink(repositories, userId, smartLinkId);
  const owned = (await repositories.customDomains.listForSmartLink(userId, smartLinkId)).find((item) => item.domain === domain);
  if (!owned) throw new Error("Custom domain not found for this SmartLink.");
  if (active && !owned.verifiedAt) throw new Error("Verify the domain before activating it.");
  const updated = await repositories.customDomains.setStatusForSmartLink(userId, smartLinkId, domain, active ? "ACTIVE" : "DISABLED", owned.verifiedAt);
  if (!updated) throw new Error("Custom domain not found for this SmartLink.");
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: active ? "CUSTOM_DOMAIN_ACTIVATED" : "CUSTOM_DOMAIN_DISABLED", resourceType: "SMART_LINK", resourceId: smartLinkId, metadata: { domain } });
  return updated;
}

export async function removeCustomDomain(userId: string, smartLinkId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  await requireEditableSmartLink(repositories, userId, smartLinkId);
  const removed = await repositories.customDomains.deleteForSmartLink(userId, smartLinkId, domain);
  if (!removed) throw new Error("Custom domain not found for this SmartLink.");
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_REMOVED", resourceType: "SMART_LINK", resourceId: smartLinkId, metadata: { domain } });
}

async function requireEditableSmartLink(
  repositories: Awaited<ReturnType<typeof getServerDependencies>>,
  userId: string,
  smartLinkId: string,
) {
  const smartLink = await repositories.smartLinks.findByIdForUser(smartLinkId, userId);
  if (!smartLink) throw new Error("SmartLink not found.");
  if (smartLink.status === "DISABLED") throw new Error("Disabled links cannot change custom domains.");
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
