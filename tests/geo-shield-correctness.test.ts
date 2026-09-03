import assert from "node:assert/strict";
import test from "node:test";

import { resolveSmartLinkGeo } from "@/server/smart-links/geo-resolver";
import { validateSmartLinkEditable } from "@/server/smart-links/smart-link-validation";
import {
  classifyTraffic,
  resolveTrafficShield,
} from "@/server/smart-links/traffic-shield";
import {
  DEFAULT_DEEPLINK_CONFIG,
  DEFAULT_SHIELD_CONFIG,
  DEFAULT_TRACKING_CONFIG,
  type GeoConfig,
  type ShieldConfig,
} from "@/types/smart-link";

const geoWithBlockingFallback: GeoConfig = {
  enabled: true,
  rules: [
    {
      id: "serbia",
      countries: ["RS"],
      action: { type: "DEFAULT_PAGE" },
    },
  ],
  fallback: { type: "BLOCK" },
};

const strictShield: ShieldConfig = {
  enabled: true,
  mode: "STRICT",
  verifiedCrawlerPolicy: "ALLOW",
};

test("unknown visitor location never applies a destructive SmartLink geo fallback", () => {
  assert.deepEqual(
    resolveSmartLinkGeo(geoWithBlockingFallback, null),
    { type: "UNKNOWN_LOCATION" },
  );
  assert.deepEqual(
    resolveSmartLinkGeo(geoWithBlockingFallback, "XX"),
    { type: "UNKNOWN_LOCATION" },
  );

  assert.deepEqual(
    resolveSmartLinkGeo(geoWithBlockingFallback, "DE"),
    { type: "ACTION", action: { type: "BLOCK" } },
  );
});

test("SmartLink validation rejects the same country in multiple geo rules", () => {
  const validation = validateSmartLinkEditable(
    {
      title: "Geo overlap",
      slug: "geo-overlap",
      status: "DRAFT",
      deeplink: structuredClone(DEFAULT_DEEPLINK_CONFIG),
      geo: {
        enabled: true,
        rules: [
          {
            id: "rule-1",
            countries: ["RS", "DE"],
            action: { type: "DEFAULT_PAGE" },
          },
          {
            id: "rule-2",
            countries: ["rs"],
            action: { type: "BLOCK" },
          },
        ],
        fallback: { type: "DEFAULT_PAGE" },
      },
      shield: structuredClone(DEFAULT_SHIELD_CONFIG),
      tracking: structuredClone(DEFAULT_TRACKING_CONFIG),
    },
    "LANDING_PAGE",
  );

  assert.deepEqual(validation, {
    ok: false,
    message: "A country can appear in only one geo rule.",
  });
});

test("Shield treats missing user agent as unknown and known unfurlers as preview traffic", () => {
  assert.equal(classifyTraffic(new Headers()), "UNKNOWN");
  assert.equal(
    classifyTraffic(new Headers({ "user-agent": "facebookexternalhit/1.1" })),
    "KNOWN_CRAWLER",
  );
  assert.equal(
    classifyTraffic(new Headers({ "user-agent": "curl/8.0" })),
    "AUTOMATION",
  );

  assert.equal(resolveTrafficShield(strictShield, "UNKNOWN"), "PREVIEW");
  assert.equal(resolveTrafficShield(strictShield, "KNOWN_CRAWLER"), "PREVIEW");
  assert.equal(resolveTrafficShield(strictShield, "AUTOMATION"), "BLOCK");
});
