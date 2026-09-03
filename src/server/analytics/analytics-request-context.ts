import { createHmac } from "node:crypto";

import { getTrustedProxyHeader, getTrustedRequestIp } from "@/server/security/request";
import {
  getSmartLinkRequestContext,
  type SmartLinkRequestContext,
} from "@/server/smart-links/request-context";

type RequestHeaders = Pick<Headers, "get">;

export function buildAnalyticsRequestMetadata(
  headers: RequestHeaders,
  context = getSmartLinkRequestContext(headers),
  now = new Date(),
) {
  return {
    visitorId: buildServerVisitorId(headers, context.userAgent, now),
    referrer: headers.get("referer")?.slice(0, 1000) ?? null,
    countryCode: context.countryCode,
    countryName: null,
    city: getTrustedProxyHeader(headers, "x-vercel-ip-city")?.slice(0, 120) ?? null,
    device: deviceName(context),
    browser: browserName(context.browser),
    os: osName(context.platform),
    isBot: context.traffic !== "HUMAN",
  };
}

export function buildServerVisitorId(
  headers: RequestHeaders,
  userAgent: string,
  now = new Date(),
) {
  const secret = process.env.LINKZZZ_ANALYTICS_HASH_SALT?.trim();
  if (!secret) return null;

  const ip = getTrustedRequestIp(headers);
  if (ip === "unknown") return null;

  const day = now.toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

function deviceName(context: SmartLinkRequestContext) {
  if (context.platform === "IOS" && /ipad/i.test(context.userAgent)) return "Tablet";
  if (context.platform === "IOS" || context.platform === "ANDROID") return "Mobile";
  return "Desktop";
}

function browserName(browser: SmartLinkRequestContext["browser"]) {
  const labels: Record<SmartLinkRequestContext["browser"], string> = {
    INSTAGRAM: "Instagram",
    FACEBOOK: "Facebook",
    MESSENGER: "Messenger",
    TIKTOK: "TikTok",
    X: "X",
    TELEGRAM: "Telegram",
    REDDIT: "Reddit",
    LINKEDIN: "LinkedIn",
    DISCORD: "Discord",
    SAFARI: "Safari",
    CHROME: "Chrome",
    EDGE: "Edge",
    FIREFOX: "Firefox",
    OTHER: "Other",
  };
  return labels[browser];
}

function osName(platform: SmartLinkRequestContext["platform"]) {
  if (platform === "IOS") return "iOS";
  if (platform === "ANDROID") return "Android";
  return "Desktop";
}
