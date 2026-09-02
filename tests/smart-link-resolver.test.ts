import assert from "node:assert/strict";
import test from "node:test";

import { destinationProviderFromPlatformId } from "@/features/destinations/provider-registry";
import { withSmartLinkOutboundRoutes } from "@/server/smart-links/outbound-routing";
import { getDestinationAppUri, safeAppUri } from "@/server/smart-links/provider-deeplink";
import {
  resolveDirectDestination,
  resolveSmartLink,
} from "@/server/smart-links/redirect-resolver";
import {
  detectBrowser,
  detectPlatform,
  getSmartLinkRequestContext,
  type SmartLinkRequestContext,
} from "@/server/smart-links/request-context";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type { DeeplinkConfig, DestinationConfig } from "@/types/smart-link";

const SMART_DEEPLINK: DeeplinkConfig = {
  enabled: true,
  strategy: "SMART",
  openInBrowserHelper: false,
  longPressHelper: false,
  android: { enabled: true },
  ios: { enabled: true },
};

const IOS_SAFARI: SmartLinkRequestContext = {
  userAgent: "test",
  platform: "IOS",
  browser: "SAFARI",
  isMobile: true,
  isInAppBrowser: false,
  countryCode: null,
  traffic: "HUMAN",
};

const ANDROID_CHROME: SmartLinkRequestContext = {
  userAgent: "test",
  platform: "ANDROID",
  browser: "CHROME",
  isMobile: true,
  isInAppBrowser: false,
  countryCode: null,
  traffic: "HUMAN",
};

const DESKTOP_CHROME: SmartLinkRequestContext = {
  userAgent: "test",
  platform: "DESKTOP",
  browser: "CHROME",
  isMobile: false,
  isInAppBrowser: false,
  countryCode: null,
  traffic: "HUMAN",
};

function destination(
  provider: DestinationConfig["provider"],
  url: string,
  patch: Partial<DestinationConfig> = {},
): DestinationConfig {
  return { provider, url, ...patch };
}

test("request context identifies mobile platforms and common in-app browsers", () => {
  const instagramIos = new Headers({
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0.0",
  });
  const context = getSmartLinkRequestContext(instagramIos);
  assert.equal(context.platform, "IOS");
  assert.equal(context.browser, "INSTAGRAM");
  assert.equal(context.isInAppBrowser, true);

  assert.equal(detectPlatform("Mozilla/5.0 (Linux; Android 15) Chrome/131 Mobile"), "ANDROID");
  assert.equal(detectBrowser("Mozilla/5.0 Edg/131.0"), "EDGE");
});

test("landing page SmartLinks remain render actions", () => {
  const result = resolveSmartLink(
    {
      type: "LANDING_PAGE",
      deeplink: SMART_DEEPLINK,
      geo: { enabled: false, rules: [], fallback: { type: "DEFAULT_PAGE" } },
      shield: { enabled: false, mode: "STANDARD", verifiedCrawlerPolicy: "ALLOW" },
    },
    IOS_SAFARI,
  );
  assert.deepEqual(result, { type: "RENDER_PAGE" });
});

test("desktop Direct SmartLinks use the canonical destination", () => {
  const result = resolveDirectDestination(
    destination("SPOTIFY", "https://open.spotify.com/track/abc"),
    SMART_DEEPLINK,
    DESKTOP_CHROME,
  );
  assert.deepEqual(result, {
    type: "REDIRECT",
    url: "https://open.spotify.com/track/abc",
  });
});

test("Smart mode creates an app-open helper for stable mobile app schemes", () => {
  const result = resolveDirectDestination(
    destination("SPOTIFY", "https://open.spotify.com/track/abc"),
    SMART_DEEPLINK,
    IOS_SAFARI,
  );
  assert.equal(result.type, "DEEPLINK_HELPER");
  if (result.type === "DEEPLINK_HELPER") {
    assert.equal(result.mode, "APP_OPEN");
    assert.equal(result.appUrl, "spotify:track:abc");
    assert.equal(result.fallbackUrl, "https://open.spotify.com/track/abc");
    assert.equal(result.autoAttempt, true);
  }
});

test("Android YouTube uses an intent URL with a browser fallback", () => {
  const appUri = getDestinationAppUri(
    destination("YOUTUBE", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "ANDROID",
  );
  assert.match(appUri ?? "", /^intent:\/\/www\.youtube\.com\/watch\?v=/);
  assert.match(appUri ?? "", /package=com\.google\.android\.youtube/);
  assert.match(appUri ?? "", /browser_fallback_url=/);
});

test("provider strategies are conservative when no stable app URI exists", () => {
  const result = resolveDirectDestination(
    destination("APPLE_MUSIC", "https://music.apple.com/us/album/example/123"),
    SMART_DEEPLINK,
    IOS_SAFARI,
  );
  assert.deepEqual(result, {
    type: "REDIRECT",
    url: "https://music.apple.com/us/album/example/123",
  });
});

test("open-in-browser helper takes priority inside restrictive in-app browsers", () => {
  const result = resolveDirectDestination(
    destination("INSTAGRAM", "https://www.instagram.com/skyhookband"),
    { ...SMART_DEEPLINK, openInBrowserHelper: true, longPressHelper: true },
    {
      ...IOS_SAFARI,
      browser: "INSTAGRAM",
      isInAppBrowser: true,
    },
  );
  assert.equal(result.type, "DEEPLINK_HELPER");
  if (result.type === "DEEPLINK_HELPER") {
    assert.equal(result.mode, "EXTERNAL_BROWSER");
    assert.equal(result.autoAttempt, false);
    assert.equal(result.appUrl, "instagram://user?username=skyhookband");
    assert.equal(result.longPressHelper, true);
  }
});

test("explicit platform configuration can disable app opening", () => {
  const result = resolveDirectDestination(
    destination("SPOTIFY", "https://open.spotify.com/track/abc"),
    { ...SMART_DEEPLINK, android: { enabled: false } },
    ANDROID_CHROME,
  );
  assert.equal(result.type, "REDIRECT");
});

test("custom platform URI overrides take priority over provider defaults", () => {
  const result = resolveDirectDestination(
    destination("SPOTIFY", "https://open.spotify.com/track/abc"),
    {
      ...SMART_DEEPLINK,
      ios: { enabled: true, customUri: "myplayer://track/abc" },
    },
    IOS_SAFARI,
  );
  assert.equal(result.type, "DEEPLINK_HELPER");
  if (result.type === "DEEPLINK_HELPER") {
    assert.equal(result.appUrl, "myplayer://track/abc");
  }
});

test("runtime refuses unsafe persisted app schemes even if bad data bypassed validation", () => {
  assert.equal(safeAppUri("javascript:alert(1)"), null);
  assert.equal(safeAppUri("data:text/html,test"), null);
  assert.equal(safeAppUri("spotify:track:abc"), "spotify:track:abc");

  const result = resolveDirectDestination(
    destination("CUSTOM", "https://example.com"),
    {
      ...SMART_DEEPLINK,
      ios: { enabled: true, customUri: "javascript:alert(1)" },
    },
    IOS_SAFARI,
  );
  assert.deepEqual(result, { type: "REDIRECT", url: "https://example.com/" });
});

test("mailto and tel destinations bypass helper timers and redirect directly", () => {
  const email = resolveDirectDestination(
    destination("EMAIL", "mailto:hello@example.com"),
    SMART_DEEPLINK,
    IOS_SAFARI,
  );
  assert.deepEqual(email, { type: "REDIRECT", url: "mailto:hello@example.com" });

  const phone = resolveDirectDestination(
    destination("PHONE", "tel:+381601234567"),
    SMART_DEEPLINK,
    ANDROID_CHROME,
  );
  assert.deepEqual(phone, { type: "REDIRECT", url: "tel:+381601234567" });
});


test("platform IDs map back to provider IDs without trusting invented values", () => {
  assert.equal(destinationProviderFromPlatformId("youtube-music"), "YOUTUBE_MUSIC");
  assert.equal(destinationProviderFromPlatformId("instagram"), "INSTAGRAM");
  assert.equal(destinationProviderFromPlatformId("made-up-network"), "CUSTOM");
});

test("landing page public destinations are routed back through SmartLink runtime", () => {
  const profile = {
    slug: "skyhook",
    links: [{
      id: "card-1",
      title: "Spotify",
      url: "https://open.spotify.com/track/abc",
      visible: true,
      geoDestinations: [{
        id: "geo-1",
        countryCode: "RS",
        countryName: "Serbia",
        url: "https://example.com/rs",
      }],
    }],
    socials: [{
      id: "social-1",
      name: "Instagram",
      url: "https://www.instagram.com/skyhookband",
      visible: true,
    }],
  } as unknown as PersistedProfileData;

  const routed = withSmartLinkOutboundRoutes(profile, "skyhook");
  assert.equal(routed.links[0]?.url, "/skyhook/out/card/card-1");
  assert.deepEqual(routed.links[0]?.geoDestinations, []);
  assert.equal(routed.socials[0]?.url, "/skyhook/out/social/social-1");
});
