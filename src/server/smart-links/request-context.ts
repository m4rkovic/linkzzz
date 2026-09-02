import { getVisitorCountryCode } from "@/server/geo/geo-routing";
import { classifyTraffic } from "@/server/smart-links/traffic-shield";
import type { SmartLinkRequestContext, VisitorBrowser, VisitorPlatform } from "@/types/smart-link-runtime";

export type { SmartLinkRequestContext, VisitorBrowser, VisitorPlatform } from "@/types/smart-link-runtime";



type RequestHeaders = Pick<Headers, "get">;

export function getSmartLinkRequestContext(
  headers: RequestHeaders,
): SmartLinkRequestContext {
  const userAgent = headers.get("user-agent")?.trim() ?? "";
  const platform = detectPlatform(userAgent);
  const browser = detectBrowser(userAgent);

  return {
    userAgent,
    platform,
    browser,
    isMobile: platform !== "DESKTOP",
    isInAppBrowser: isInAppBrowser(browser),
    countryCode: getVisitorCountryCode(headers),
    traffic: classifyTraffic(headers),
  };
}

export function detectPlatform(userAgent: string): VisitorPlatform {
  if (/android/i.test(userAgent)) return "ANDROID";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "IOS";
  // iPadOS may advertise itself as macOS while still exposing Mobile/ touch UA
  // fragments. This catches the common desktop-class Safari form.
  if (/macintosh/i.test(userAgent) && /mobile/i.test(userAgent)) return "IOS";
  return "DESKTOP";
}

export function detectBrowser(userAgent: string): VisitorBrowser {
  if (/instagram/i.test(userAgent)) return "INSTAGRAM";
  if (/messengerforios|\bfb_iab\/messenger|\bfban\/messenger/i.test(userAgent)) {
    return "MESSENGER";
  }
  if (/\bfbav\/|\bfban\/|\bfb_iab\/|\bfb4a\b|\bfbios\b/i.test(userAgent)) {
    return "FACEBOOK";
  }
  if (/tiktok|bytedancewebview|musical_ly/i.test(userAgent)) return "TIKTOK";
  if (/twitterandroid|twitter for iphone|\btwitter\//i.test(userAgent)) return "X";
  if (/telegram/i.test(userAgent)) return "TELEGRAM";
  if (/reddit/i.test(userAgent)) return "REDDIT";
  if (/linkedinapp/i.test(userAgent)) return "LINKEDIN";
  if (/discord/i.test(userAgent)) return "DISCORD";
  if (/edg|edgios|edga/i.test(userAgent)) return "EDGE";
  if (/firefox|fxios/i.test(userAgent)) return "FIREFOX";
  if (/chrome|crios/i.test(userAgent)) return "CHROME";
  if (/safari/i.test(userAgent)) return "SAFARI";
  return "OTHER";
}

export function isInAppBrowser(browser: VisitorBrowser) {
  return [
    "INSTAGRAM",
    "FACEBOOK",
    "MESSENGER",
    "TIKTOK",
    "X",
    "TELEGRAM",
    "REDDIT",
    "LINKEDIN",
    "DISCORD",
  ].includes(browser);
}

export function browserDisplayName(browser: VisitorBrowser) {
  switch (browser) {
    case "INSTAGRAM": return "Instagram";
    case "FACEBOOK": return "Facebook";
    case "MESSENGER": return "Messenger";
    case "TIKTOK": return "TikTok";
    case "X": return "X";
    case "TELEGRAM": return "Telegram";
    case "REDDIT": return "Reddit";
    case "LINKEDIN": return "LinkedIn";
    case "DISCORD": return "Discord";
    case "SAFARI": return "Safari";
    case "CHROME": return "Chrome";
    case "EDGE": return "Edge";
    case "FIREFOX": return "Firefox";
    default: return "browser";
  }
}
