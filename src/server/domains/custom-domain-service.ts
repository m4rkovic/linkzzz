import "server-only";

import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { resolveTxt } from "node:dns/promises";
import { domainToASCII } from "node:url";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { CustomDomainRecord } from "@/server/services/contracts";

export function normalizeCustomDomain(input: string) {
  const raw = input.trim().toLowerCase().replace(/\.$/, "");
  if (!raw || raw.includes("://") || raw.includes("/") || raw.includes("@")) throw new Error("Enter a hostname without protocol or path.");
  const domain = domainToASCII(raw);
  if (!domain || domain.length > 253 || isIP(domain) || domain === "localhost") throw new Error("Enter a valid public domain.");
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error("Enter a valid public domain.");
  return domain;
}

export async function listCustomDomains(userId: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  return repositories.customDomains.listForUser(userId);
}

export async function resolveActiveCustomDomain(domain: string) {
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) return null;
  return repositories.customDomains.findActiveSlugByDomain(domain);
}

export async function addCustomDomain(userId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  const existing = await repositories.customDomains.findByDomain(domain);
  if (existing) throw new Error("This domain is already connected to a profile.");
  const record = await repositories.customDomains.createForUser(userId, domain, randomBytes(24).toString("base64url"));
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_ADDED", resourceType: "CUSTOM_DOMAIN", resourceId: record.id, metadata: { domain } });
  return record;
}

export async function verifyCustomDomain(userId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  const owned = (await repositories.customDomains.listForUser(userId)).find((item) => item.domain === domain);
  if (!owned) throw new Error("Custom domain not found.");
  let values: string[][];
  try { values = await resolveTxt(`_linkzzz-verification.${domain}`); }
  catch { throw new Error("Verification TXT record was not found yet."); }
  if (!values.some((parts) => parts.join("") === owned.verificationToken)) throw new Error("Verification TXT value does not match.");
  const verified = await repositories.customDomains.setStatusForUser(userId, domain, "VERIFIED", new Date());
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_VERIFIED", resourceType: "CUSTOM_DOMAIN", resourceId: owned.id, metadata: { domain } });
  return verified!;
}

export async function setCustomDomainActive(userId: string, input: string, active: boolean) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  const owned = (await repositories.customDomains.listForUser(userId)).find((item) => item.domain === domain);
  if (!owned) throw new Error("Custom domain not found.");
  if (active && !owned.verifiedAt) throw new Error("Verify the domain before activating it.");
  return (await repositories.customDomains.setStatusForUser(userId, domain, active ? "ACTIVE" : "DISABLED", owned.verifiedAt))!;
}

export async function removeCustomDomain(userId: string, input: string) {
  const domain = normalizeCustomDomain(input);
  const repositories = await getServerDependencies();
  if (!repositories.customDomains) throw new Error("Custom domain persistence is unavailable.");
  const removed = await repositories.customDomains.deleteForUser(userId, domain);
  if (!removed) throw new Error("Custom domain not found.");
  await repositories.audit.write({ actorUserId: userId, targetUserId: userId, action: "CUSTOM_DOMAIN_REMOVED", resourceType: "CUSTOM_DOMAIN", metadata: { domain } });
}

export function customDomainDnsInstructions(record: CustomDomainRecord) {
  return { type: "TXT", name: `_linkzzz-verification.${record.domain}`, value: record.verificationToken };
}
