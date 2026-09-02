import assert from "node:assert/strict";
import test from "node:test";

import {
  validateDestinationConfig,
  validateSmartLinkEditable,
} from "@/server/smart-links/smart-link-validation";
import type { SmartLinkEditableData } from "@/types/smart-link";

function validDirectPayload(): SmartLinkEditableData {
  return {
    title: "Listen now",
    slug: "listen-now",
    status: "DRAFT",
    primaryDestination: {
      provider: "SPOTIFY",
      url: "https://open.spotify.com/artist/example",
      fallbackUrl: "https://open.spotify.com/artist/example",
    },
    deeplink: {
      enabled: true,
      strategy: "SMART",
      openInBrowserHelper: false,
      longPressHelper: false,
      android: { enabled: true },
      ios: { enabled: true },
    },
    geo: {
      enabled: false,
      rules: [],
      fallback: { type: "DEFAULT_PAGE" },
    },
    shield: {
      enabled: false,
      mode: "STANDARD",
      verifiedCrawlerPolicy: "ALLOW",
    },
    tracking: {
      internalAnalytics: true,
    },
  };
}

test("Direct SmartLinks require a safe provider destination", () => {
  const missing = validDirectPayload();
  delete (missing as { primaryDestination?: unknown }).primaryDestination;
  assert.equal(validateSmartLinkEditable(missing, "DIRECT").ok, false);

  const unsafe = validDirectPayload();
  unsafe.primaryDestination!.url = "javascript:alert(1)";
  assert.equal(validateSmartLinkEditable(unsafe, "DIRECT").ok, false);

  assert.equal(validateSmartLinkEditable(validDirectPayload(), "DIRECT").ok, true);
});

test("Geo SmartLink rules require ISO country codes and an explicit fallback action", () => {
  const invalid = validDirectPayload();
  invalid.geo = {
    enabled: true,
    rules: [{
      id: "rs-rule",
      countries: ["Serbia"],
      action: {
        type: "REDIRECT",
        destination: {
          provider: "YOUTUBE",
          url: "https://youtube.com/example",
        },
      },
    }],
    fallback: { type: "BLOCK" },
  };
  assert.equal(validateSmartLinkEditable(invalid, "DIRECT").ok, false);

  const valid = validDirectPayload();
  valid.geo = {
    enabled: true,
    rules: [{
      id: "rs-rule",
      countries: ["rs"],
      action: {
        type: "REDIRECT",
        destination: {
          provider: "YOUTUBE",
          url: "https://youtube.com/example",
        },
      },
    }],
    fallback: { type: "BLOCK" },
  };
  const result = validateSmartLinkEditable(valid, "DIRECT");
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value.geo.rules[0]?.countries, ["RS"]);
});

test("Custom deeplink URIs allow app schemes but reject dangerous schemes", () => {
  const unsafe = validDirectPayload();
  unsafe.deeplink.android = { enabled: true, customUri: "javascript:alert(1)" };
  assert.equal(validateSmartLinkEditable(unsafe, "DIRECT").ok, false);

  const safe = validDirectPayload();
  safe.deeplink.android = { enabled: true, customUri: "intent://track#Intent;scheme=spotify;end" };
  safe.deeplink.ios = { enabled: true, customUri: "spotify://track/example" };
  assert.equal(validateSmartLinkEditable(safe, "DIRECT").ok, true);
});

test("Tracking validates GA4 and Meta Pixel identifiers", () => {
  const invalid = validDirectPayload();
  invalid.tracking = {
    internalAnalytics: true,
    ga4MeasurementId: "UA-OLD-ID",
    metaPixelId: "not-digits",
  };
  assert.equal(validateSmartLinkEditable(invalid, "DIRECT").ok, false);

  const valid = validDirectPayload();
  valid.tracking = {
    internalAnalytics: true,
    ga4MeasurementId: "g-abc12345",
    metaPixelId: "123456789012345",
  };
  const result = validateSmartLinkEditable(valid, "DIRECT");
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.tracking.ga4MeasurementId, "G-ABC12345");
});

test("Destination normalization keeps URL semantics and canonicalizes provider IDs", () => {
  const result = validateDestinationConfig({
    provider: "  spotify  ",
    url: "https://open.spotify.com/artist/example",
    fallbackUrl: "",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.provider, "SPOTIFY");
    assert.equal(result.value.url, "https://open.spotify.com/artist/example");
    assert.equal(result.value.fallbackUrl, undefined);
  }
});
