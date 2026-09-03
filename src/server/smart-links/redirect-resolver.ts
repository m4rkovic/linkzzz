import { getDestinationProvider } from "@/features/destinations/provider-registry";
import { resolveSmartLinkGeoAction } from "@/server/smart-links/geo-resolver";
import { getDestinationAppUri, safeAppUri } from "@/server/smart-links/provider-deeplink";
import type { SmartLinkRequestContext } from "@/types/smart-link-runtime";
import { resolveTrafficShield } from "@/server/smart-links/traffic-shield";
import type { DestinationConfig, SmartLinkRecord } from "@/types/smart-link";

export type SmartLinkResolveResult =
  | { type: "RENDER_PAGE" }
  | { type: "NOT_FOUND" }
  | { type: "BLOCK" }
  | { type: "CRAWLER_PREVIEW" }
  | { type: "REDIRECT"; url: string }
  | {
      type: "DEEPLINK_HELPER";
      mode: "APP_OPEN" | "EXTERNAL_BROWSER";
      providerName: string;
      appUrl: string | null;
      fallbackUrl: string;
      browser: SmartLinkRequestContext["browser"];
      platform: SmartLinkRequestContext["platform"];
      longPressHelper: boolean;
      autoAttempt: boolean;
    };

export function resolveSmartLink(
  smartLink: Pick<SmartLinkRecord, "type" | "primaryDestination" | "deeplink" | "geo" | "shield">,
  context: SmartLinkRequestContext,
): SmartLinkResolveResult {
  const shield = resolveTrafficShield(smartLink.shield, context.traffic);
  if (shield === "BLOCK") return { type: "BLOCK" };
  if (shield === "PREVIEW") return { type: "CRAWLER_PREVIEW" };

  const geoAction = resolveSmartLinkGeoAction(smartLink.geo, context.countryCode);
  if (geoAction?.type === "BLOCK") return { type: "BLOCK" };
  if (geoAction?.type === "REDIRECT") {
    return resolveDirectDestination(geoAction.destination, smartLink.deeplink, context);
  }

  if (smartLink.type === "LANDING_PAGE") return { type: "RENDER_PAGE" };
  const destination = smartLink.primaryDestination;
  if (!destination) return { type: "NOT_FOUND" };
  return resolveDirectDestination(destination, smartLink.deeplink, context);
}

export function resolveOutboundDestination(
  smartLink: Pick<SmartLinkRecord, "deeplink" | "geo" | "shield">,
  destination: DestinationConfig,
  context: SmartLinkRequestContext,
): SmartLinkResolveResult {
  const shield = resolveTrafficShield(smartLink.shield, context.traffic);
  if (shield === "BLOCK") return { type: "BLOCK" };
  if (shield === "PREVIEW") return { type: "CRAWLER_PREVIEW" };

  const geoAction = resolveSmartLinkGeoAction(smartLink.geo, context.countryCode);
  if (geoAction?.type === "BLOCK") return { type: "BLOCK" };
  if (geoAction?.type === "REDIRECT") {
    return resolveDirectDestination(geoAction.destination, smartLink.deeplink, context);
  }

  return resolveDirectDestination(destination, smartLink.deeplink, context);
}

export function resolveDirectDestination(
  destination: DestinationConfig,
  deeplink: SmartLinkRecord["deeplink"],
  context: SmartLinkRequestContext,
): SmartLinkResolveResult {
  const destinationUrl = safeDestinationUrl(destination.url);
  if (!destinationUrl) return { type: "NOT_FOUND" };
  const fallbackUrl = safeHttpUrl(destination.fallbackUrl) ?? destinationUrl;

  if (!deeplink.enabled || deeplink.strategy === "STANDARD_REDIRECT" || context.platform === "DESKTOP" || isTerminalDestination(destinationUrl)) {
    return { type: "REDIRECT", url: destinationUrl };
  }

  const platformConfig = context.platform === "ANDROID" ? deeplink.android : deeplink.ios;
  if (platformConfig?.enabled === false) return { type: "REDIRECT", url: destinationUrl };

  const configuredUri = safeAppUri(platformConfig?.customUri);
  const appUrl = configuredUri ?? getDestinationAppUri(destination, context.platform);
  const providerName = getDestinationProvider(destination.provider).name;

  if (deeplink.strategy === "EXTERNAL_BROWSER_HELPER") {
    return helper({ mode: "EXTERNAL_BROWSER", providerName, appUrl, fallbackUrl, context, longPressHelper: deeplink.longPressHelper, autoAttempt: false });
  }
  if (context.isInAppBrowser && deeplink.openInBrowserHelper) {
    return helper({ mode: "EXTERNAL_BROWSER", providerName, appUrl, fallbackUrl, context, longPressHelper: deeplink.longPressHelper, autoAttempt: false });
  }
  if (!appUrl) return { type: "REDIRECT", url: destinationUrl };
  return helper({ mode: "APP_OPEN", providerName, appUrl, fallbackUrl, context, longPressHelper: deeplink.longPressHelper, autoAttempt: true });
}

function helper(input: { mode: "APP_OPEN" | "EXTERNAL_BROWSER"; providerName: string; appUrl: string | null; fallbackUrl: string; context: SmartLinkRequestContext; longPressHelper: boolean; autoAttempt: boolean; }): SmartLinkResolveResult {
  return { type: "DEEPLINK_HELPER", mode: input.mode, providerName: input.providerName, appUrl: input.appUrl, fallbackUrl: input.fallbackUrl, browser: input.context.browser, platform: input.context.platform, longPressHelper: input.longPressHelper, autoAttempt: input.autoAttempt };
}

function isTerminalDestination(value: string) { return /^(?:mailto|tel):/i.test(value); }
function safeDestinationUrl(value: string) { const text = value.trim(); if (/^(?:mailto|tel):/i.test(text)) return safeAppUri(text); return safeHttpUrl(text); }
function safeHttpUrl(value: string | null | undefined) { if (!value) return null; try { const parsed = new URL(value); if (!["http:", "https:"].includes(parsed.protocol)) return null; return parsed.toString(); } catch { return null; } }
