import type { ShieldConfig } from "@/types/smart-link";
import type { TrafficKind } from "@/types/smart-link-runtime";

type RequestHeaders = Pick<Headers, "get">;

export type ShieldDecision = "ALLOW" | "BLOCK" | "PREVIEW";

const KNOWN_CRAWLER = /(googlebot|bingbot|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterestbot|redditbot|yandexbot|baiduspider)/i;
const AUTOMATION = /(bot\b|crawler|spider|headlesschrome|phantomjs|curl\/|wget\/|python-requests|python\/|axios\/|go-http-client|java\/|httpclient|scrapy)/i;

export function classifyTraffic(headers: RequestHeaders): TrafficKind {
  if (isTrustedVerifiedCrawler(headers)) return "VERIFIED_CRAWLER";
  const userAgent = headers.get("user-agent")?.trim() ?? "";
  if (KNOWN_CRAWLER.test(userAgent)) return "KNOWN_CRAWLER";
  if (!userAgent || AUTOMATION.test(userAgent)) return "AUTOMATION";
  return "HUMAN";
}

export function resolveTrafficShield(
  shield: ShieldConfig,
  traffic: TrafficKind,
): ShieldDecision {
  if (!shield.enabled || traffic === "HUMAN") return "ALLOW";

  if (traffic === "VERIFIED_CRAWLER") {
    return shield.verifiedCrawlerPolicy;
  }

  if (shield.mode === "STRICT") return "BLOCK";
  if (traffic === "KNOWN_CRAWLER") return "PREVIEW";
  return "BLOCK";
}

function isTrustedVerifiedCrawler(headers: RequestHeaders) {
  const secret = process.env.LINKZZZ_EDGE_BOT_SECRET?.trim();
  if (!secret) return false;
  const suppliedSecret = headers.get("x-linkzzz-edge-bot-secret")?.trim();
  const verified = headers.get("x-linkzzz-verified-crawler")?.trim().toLowerCase();
  return suppliedSecret === secret && ["1", "true", "yes"].includes(verified ?? "");
}
