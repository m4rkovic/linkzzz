import "server-only";

import { createHmac } from "node:crypto";

import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AnalyticsEventRecord } from "@/server/services/contracts";
import type { SmartLinkRequestContext } from "@/types/smart-link-runtime";
import type { SmartLinkRecord } from "@/types/smart-link";

type RequestHeaders = Pick<Headers, "get">;

type RuntimeEventType = Extract<
  AnalyticsEventRecord["type"],
  | "SMART_LINK_VIEW"
  | "LINK_CLICK"
  | "SOCIAL_CLICK"
  | "DEEPLINK_ATTEMPT"
  | "DEEPLINK_FALLBACK"
  | "BLOCKED_AUTOMATED_REQUEST"
>;

export async function recordSmartLinkRuntimeEvent(input: {
  smartLink: Pick<SmartLinkRecord, "id" | "tracking">;
  headers: RequestHeaders;
  context: SmartLinkRequestContext;
  type: RuntimeEventType;
  pageCardId?: string | null;
}) {
  if (!input.smartLink.tracking.internalAnalytics) return;

  try {
    const dependencies = await getServerDependencies();
    if (!dependencies.analytics) return;

    await dependencies.analytics.create({
      smartLinkId: input.smartLink.id,
      pageCardId: input.pageCardId ?? null,
      type: input.type,
      visitorId: buildVisitorId(input.headers, input.context.userAgent),
      referrer: input.headers.get("referer")?.slice(0, 1000) ?? null,
      countryCode: input.context.countryCode,
      countryName: null,
      city: input.headers.get("x-vercel-ip-city")?.slice(0, 120) ?? null,
      device: deviceName(input.context),
      browser: browserName(input.context.browser),
      os: osName(input.context.platform),
      isBot: input.context.traffic !== "HUMAN",
    });
  } catch {
    // Analytics must never break a public redirect or profile render.
  }
}

export function shouldRecordBlockedAutomation(context: SmartLinkRequestContext) {
  return context.traffic !== "HUMAN";
}

function buildVisitorId(headers: RequestHeaders, userAgent: string) {
  const secret = process.env.LINKZZZ_ANALYTICS_HASH_SALT?.trim();
  if (!secret) return null;
  const ip = firstHeaderIp(headers.get("x-forwarded-for")) ?? headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`${day}|${ip}|${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

function firstHeaderIp(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

function deviceName(context: SmartLinkRequestContext) {
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
