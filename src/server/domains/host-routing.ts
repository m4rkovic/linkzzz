import { isIP } from "node:net";
import { domainToASCII } from "node:url";

const DEFAULT_APP_HOSTS = ["linkzzz.com", "www.linkzzz.com"];

const CUSTOM_DOMAIN_OUTBOUND_PATH =
  /^\/[a-z0-9_-]+\/out\/(?:card|social|block)\/[^/]+\/?$/;
const CUSTOM_DOMAIN_LEAD_PATH =
  /^\/api\/public\/smart-links\/[a-z0-9_-]+\/leads\/?$/;
const CUSTOM_DOMAIN_ANALYTICS_PATH = /^\/api\/analytics\/events\/?$/;

export function normalizeRequestHostname(value: string | null | undefined) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return null;

  let hostname = first;
  if (hostname.startsWith("[")) {
    const closing = hostname.indexOf("]");
    if (closing < 0) return null;
    hostname = hostname.slice(1, closing);
  } else {
    hostname = hostname.split(":")[0] ?? "";
  }

  hostname = hostname.replace(/\.$/, "");
  if (!hostname) return null;
  if (isIP(hostname)) return hostname;

  const ascii = domainToASCII(hostname);
  return ascii ? ascii.toLowerCase() : null;
}

export function getConfiguredApplicationHosts(environment: NodeJS.ProcessEnv = process.env) {
  const configured = (environment.LINKZZZ_APP_HOSTS ?? DEFAULT_APP_HOSTS.join(","))
    .split(",")
    .map((value) => normalizeRequestHostname(value))
    .filter((value): value is string => Boolean(value));
  return [...new Set(configured)];
}

export function isApplicationHostname(hostname: string, environment: NodeJS.ProcessEnv = process.env) {
  const normalized = normalizeRequestHostname(hostname);
  if (!normalized) return false;
  if (normalized === "localhost" || normalized.endsWith(".localhost") || isIP(normalized)) return true;
  return getConfiguredApplicationHosts(environment).includes(normalized);
}

export function isReservedPlatformHostname(hostname: string, environment: NodeJS.ProcessEnv = process.env) {
  const normalized = normalizeRequestHostname(hostname);
  if (!normalized) return false;
  return getConfiguredApplicationHosts(environment).some((appHost) => {
    const root = appHost.startsWith("www.") ? appHost.slice(4) : appHost;
    return normalized === root || normalized.endsWith(`.${root}`);
  });
}

export function getRequestHostname(headers: Headers, environment: NodeJS.ProcessEnv = process.env) {
  const trustForwarded = environment.LINKZZZ_TRUST_PROXY_HEADERS === "1";
  if (trustForwarded) {
    const forwarded = normalizeRequestHostname(headers.get("x-forwarded-host"));
    if (forwarded) return forwarded;
  }
  return normalizeRequestHostname(headers.get("host"));
}

export function isAllowedCustomDomainPath(pathname: string) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/uploads/")) return true;
  if (CUSTOM_DOMAIN_ANALYTICS_PATH.test(pathname)) return true;
  if (CUSTOM_DOMAIN_LEAD_PATH.test(pathname)) return true;
  return CUSTOM_DOMAIN_OUTBOUND_PATH.test(pathname);
}
