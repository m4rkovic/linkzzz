import assert from "node:assert/strict";
import test from "node:test";

import { resolveSmartLinkGeoAction } from "@/server/smart-links/geo-resolver";
import { resolveSmartLink } from "@/server/smart-links/redirect-resolver";
import { classifyTraffic, resolveTrafficShield } from "@/server/smart-links/traffic-shield";
import type { SmartLinkRequestContext } from "@/types/smart-link-runtime";
import type { SmartLinkRecord } from "@/types/smart-link";

const context: SmartLinkRequestContext = {
  userAgent: "Mozilla/5.0",
  platform: "DESKTOP",
  browser: "CHROME",
  isMobile: false,
  isInAppBrowser: false,
  countryCode: "RS",
  traffic: "HUMAN",
};

const base = {
  type: "DIRECT" as const,
  primaryDestination: { provider: "CUSTOM" as const, url: "https://example.com/default" },
  deeplink: {
    enabled: true,
    strategy: "SMART" as const,
    openInBrowserHelper: false,
    longPressHelper: false,
    android: { enabled: true },
    ios: { enabled: true },
  },
  geo: {
    enabled: true,
    rules: [{
      id: "rs",
      countries: ["RS"],
      action: { type: "REDIRECT" as const, destination: { provider: "CUSTOM" as const, url: "https://example.com/rs" } },
    }],
    fallback: { type: "REDIRECT" as const, destination: { provider: "CUSTOM" as const, url: "https://example.com/world" } },
  },
  shield: { enabled: false, mode: "STANDARD" as const, verifiedCrawlerPolicy: "ALLOW" as const },
} satisfies Pick<SmartLinkRecord, "type" | "primaryDestination" | "deeplink" | "geo" | "shield">;

test("SmartLink geo resolves matching country before the primary destination", () => {
  assert.deepEqual(resolveSmartLink(base, context), { type: "REDIRECT", url: "https://example.com/rs" });
});

test("SmartLink geo uses fallback when country is missing or unmatched", () => {
  assert.equal(resolveSmartLinkGeoAction(base.geo, "US")?.type, "REDIRECT");
  assert.deepEqual(resolveSmartLink(base, { ...context, countryCode: null }), { type: "REDIRECT", url: "https://example.com/world" });
});

test("geo BLOCK prevents resolution", () => {
  const result = resolveSmartLink({ ...base, geo: { ...base.geo, rules: [{ id: "rs", countries: ["RS"], action: { type: "BLOCK" as const } }] } }, context);
  assert.deepEqual(result, { type: "BLOCK" });
});

test("STANDARD shield previews known crawlers and blocks generic automation", () => {
  const shield = { enabled: true, mode: "STANDARD" as const, verifiedCrawlerPolicy: "ALLOW" as const };
  assert.equal(resolveTrafficShield(shield, "KNOWN_CRAWLER"), "PREVIEW");
  assert.equal(resolveTrafficShield(shield, "AUTOMATION"), "BLOCK");
});

test("STRICT shield blocks unverified crawler traffic", () => {
  const shield = { enabled: true, mode: "STRICT" as const, verifiedCrawlerPolicy: "ALLOW" as const };
  assert.equal(resolveTrafficShield(shield, "KNOWN_CRAWLER"), "BLOCK");
  assert.equal(resolveTrafficShield(shield, "AUTOMATION"), "BLOCK");
});

test("known crawler and generic automation classification stays distinct", () => {
  assert.equal(classifyTraffic(new Headers({ "user-agent": "Googlebot/2.1" })), "KNOWN_CRAWLER");
  assert.equal(classifyTraffic(new Headers({ "user-agent": "curl/8.7.1" })), "AUTOMATION");
  assert.equal(classifyTraffic(new Headers({ "user-agent": "Mozilla/5.0 Chrome/131" })), "HUMAN");
});


test("verified crawler trust requires the configured edge secret", () => {
  const previous = process.env.LINKZZZ_EDGE_BOT_SECRET;
  process.env.LINKZZZ_EDGE_BOT_SECRET = "test-edge-secret";
  try {
    assert.equal(classifyTraffic(new Headers({
      "user-agent": "Googlebot/2.1",
      "x-linkzzz-verified-crawler": "true",
      "x-linkzzz-edge-bot-secret": "wrong",
    })), "KNOWN_CRAWLER");
    assert.equal(classifyTraffic(new Headers({
      "user-agent": "Googlebot/2.1",
      "x-linkzzz-verified-crawler": "true",
      "x-linkzzz-edge-bot-secret": "test-edge-secret",
    })), "VERIFIED_CRAWLER");
  } finally {
    if (previous === undefined) delete process.env.LINKZZZ_EDGE_BOT_SECRET;
    else process.env.LINKZZZ_EDGE_BOT_SECRET = previous;
  }
});
