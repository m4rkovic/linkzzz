import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAnalyticsRequestMetadata,
  buildServerVisitorId,
} from "@/server/analytics/analytics-request-context";

const TEST_NOW = new Date("2026-09-03T12:00:00.000Z");

test("analytics metadata ignores spoofed proxy identity when proxy trust is disabled", () => {
  const previousTrust = process.env.LINKZZZ_TRUST_PROXY_HEADERS;
  const previousGeoHeader = process.env.LINKZZZ_GEO_HEADER;
  const previousSalt = process.env.LINKZZZ_ANALYTICS_HASH_SALT;
  try {
    delete process.env.LINKZZZ_TRUST_PROXY_HEADERS;
    delete process.env.LINKZZZ_GEO_HEADER;
    process.env.LINKZZZ_ANALYTICS_HASH_SALT = "unit-test-salt";
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 Chrome/120.0 Safari/537.36",
      "x-forwarded-for": "203.0.113.55",
      "x-vercel-ip-country": "RS",
      "x-vercel-ip-city": "Nis",
    });

    const metadata = buildAnalyticsRequestMetadata(headers, undefined, TEST_NOW);
    assert.equal(metadata.visitorId, null);
    assert.equal(metadata.countryCode, null);
    assert.equal(metadata.city, null);
    assert.equal(metadata.isBot, false);
  } finally {
    restoreEnvironment("LINKZZZ_TRUST_PROXY_HEADERS", previousTrust);
    restoreEnvironment("LINKZZZ_GEO_HEADER", previousGeoHeader);
    restoreEnvironment("LINKZZZ_ANALYTICS_HASH_SALT", previousSalt);
  }
});

test("analytics metadata derives stable server identity from trusted request context", () => {
  const previousTrust = process.env.LINKZZZ_TRUST_PROXY_HEADERS;
  const previousGeoHeader = process.env.LINKZZZ_GEO_HEADER;
  const previousSalt = process.env.LINKZZZ_ANALYTICS_HASH_SALT;
  try {
    process.env.LINKZZZ_TRUST_PROXY_HEADERS = "1";
    process.env.LINKZZZ_GEO_HEADER = "x-vercel-ip-country";
    process.env.LINKZZZ_ANALYTICS_HASH_SALT = "unit-test-salt";
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36",
      "x-forwarded-for": "203.0.113.55, 10.0.0.2",
      "x-vercel-ip-country": "RS",
      "x-vercel-ip-city": "Nis",
    });

    const metadata = buildAnalyticsRequestMetadata(headers, undefined, TEST_NOW);
    assert.match(metadata.visitorId ?? "", /^[a-f0-9]{32}$/);
    assert.equal(metadata.visitorId, buildServerVisitorId(headers, headers.get("user-agent") ?? "", TEST_NOW));
    assert.equal(metadata.countryCode, "RS");
    assert.equal(metadata.city, "Nis");
    assert.equal(metadata.device, "Mobile");
    assert.equal(metadata.browser, "Chrome");
    assert.equal(metadata.os, "Android");
    assert.equal(metadata.isBot, false);

    const nextDay = buildServerVisitorId(
      headers,
      headers.get("user-agent") ?? "",
      new Date("2026-09-04T12:00:00.000Z"),
    );
    assert.notEqual(nextDay, metadata.visitorId);
  } finally {
    restoreEnvironment("LINKZZZ_TRUST_PROXY_HEADERS", previousTrust);
    restoreEnvironment("LINKZZZ_GEO_HEADER", previousGeoHeader);
    restoreEnvironment("LINKZZZ_ANALYTICS_HASH_SALT", previousSalt);
  }
});

test("analytics bot classification comes from the shared SmartLink traffic classifier", () => {
  const headers = new Headers({ "user-agent": "Googlebot/2.1" });
  const metadata = buildAnalyticsRequestMetadata(headers, undefined, TEST_NOW);
  assert.equal(metadata.isBot, true);
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
