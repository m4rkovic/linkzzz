import { isIP } from "node:net";
import { domainToASCII } from "node:url";
import { isReservedPlatformHostname, normalizeRequestHostname } from "@/server/domains/host-routing";

const DEFAULT_CUSTOM_DOMAIN_TARGET = "domains.linkzzz.com";

export function normalizeCustomDomain(input: string, environment: NodeJS.ProcessEnv = process.env) {
  const raw = input.trim().toLowerCase().replace(/\.$/, "");
  if (!raw || raw.includes("://") || raw.includes("/") || raw.includes("@")) throw new Error("Enter a hostname without protocol or path.");
  const domain = domainToASCII(raw);
  if (!domain || domain.length > 253 || isIP(domain) || domain === "localhost") throw new Error("Enter a valid public domain.");
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) throw new Error("Enter a valid public domain.");
  if (isReservedPlatformHostname(domain, environment)) throw new Error("Linkzzz platform hostnames cannot be connected as custom domains.");
  return domain;
}

export function getCustomDomainRoutingTarget(environment: NodeJS.ProcessEnv = process.env) {
  const value = environment.LINKZZZ_CUSTOM_DOMAIN_TARGET?.trim() || DEFAULT_CUSTOM_DOMAIN_TARGET;
  if (value.includes("://") || value.includes("/") || value.includes("@")) {
    throw new Error("LINKZZZ_CUSTOM_DOMAIN_TARGET must be a public hostname.");
  }
  const normalized = normalizeRequestHostname(value);
  const labels = normalized?.split(".") ?? [];
  const validLabels = labels.length >= 2 && labels.every(
    (label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
  );
  if (!normalized || normalized === "localhost" || isIP(normalized) || !validLabels) {
    throw new Error("LINKZZZ_CUSTOM_DOMAIN_TARGET must be a public hostname.");
  }
  return normalized;
}
