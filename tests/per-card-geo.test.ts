import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  effectiveLinkGeo,
  linkGeoToLegacyDestinations,
  resolveLinkGeo,
} from "@/features/links/link-geo";
import { validateLinkGeoConfig } from "@/features/links/link-geo-editor";
import { resolvePublicProfileGeoRouting } from "@/server/geo/geo-routing";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { LinkGeoConfig } from "@/types/profile";
import type { PersistedProfileData } from "@/types/persisted-profile";

const geo: LinkGeoConfig = {
  enabled: true,
  fallback: "SHOW",
  rules: [
    {
      id: "rule-de",
      countryCode: "DE",
      countryName: "Germany",
      action: "REDIRECT",
      destination: {
        provider: "INSTAGRAM",
        value: "@linkzzz",
        url: "https://www.instagram.com/linkzzz",
      },
    },
    {
      id: "rule-us",
      countryCode: "US",
      countryName: "United States",
      action: "HIDE",
    },
  ],
};

test("per-card Geo can redirect, hide and fall back to the default card", () => {
  const link = {
    url: "https://default.example.com/",
    geo,
    geoDestinations: [],
  };

  const redirected = resolveLinkGeo(link, "DE");
  assert.equal(redirected.visible, true);
  assert.equal(redirected.url, "https://www.instagram.com/linkzzz");
  assert.equal(redirected.action, "REDIRECT");
  assert.equal(redirected.matchedRuleId, "rule-de");
  assert.equal(redirected.destination?.provider, "INSTAGRAM");
  assert.equal(resolveLinkGeo(link, "US").visible, false);
  assert.deepEqual(resolveLinkGeo(link, "FR"), {
    visible: true,
    url: "https://default.example.com/",
    action: "SHOW",
  });
});

test("disabling the new Geo config ignores its legacy redirect mirror", () => {
  const disabled: LinkGeoConfig = { ...geo, enabled: false };
  const legacyMirror = linkGeoToLegacyDestinations(geo);
  const result = resolveLinkGeo(
    { url: "https://default.example.com/", geo: disabled, geoDestinations: legacyMirror },
    "DE",
  );
  assert.equal(result.url, "https://default.example.com/");
  assert.equal(result.action, "SHOW");
});

test("fallback Hide plus explicit Show creates a country whitelist", () => {
  const whitelist: LinkGeoConfig = {
    enabled: true,
    fallback: "HIDE",
    rules: [
      {
        id: "rule-rs",
        countryCode: "RS",
        countryName: "Serbia",
        action: "SHOW",
      },
    ],
  };
  const link = { url: "https://example.com/", geo: whitelist, geoDestinations: [] };

  assert.equal(resolveLinkGeo(link, "RS").visible, true);
  assert.equal(resolveLinkGeo(link, "DE").visible, false);
  assert.equal(resolveLinkGeo(link, null).visible, false);
});

test("public server routing removes hidden cards and does not expose the Geo rules", () => {
  const profile = createProfile();
  const hidden = resolvePublicProfileGeoRouting(profile, "US");
  assert.equal(hidden.links.length, 0);

  const redirected = resolvePublicProfileGeoRouting(profile, "DE");
  assert.equal(redirected.links.length, 1);
  assert.equal(redirected.links[0]?.url, "https://www.instagram.com/linkzzz");
  assert.equal(redirected.links[0]?.geo, undefined);
  assert.deepEqual(redirected.links[0]?.geoDestinations, []);
});

test("legacy country destinations still resolve and upgrade into the new model", () => {
  const legacy = [
    {
      id: "legacy-de",
      countryCode: "DE",
      countryName: "Germany",
      url: "https://de.example.com/",
    },
  ];
  const upgraded = effectiveLinkGeo(undefined, legacy);
  assert.equal(upgraded.enabled, true);
  assert.equal(upgraded.rules[0]?.action, "REDIRECT");
  assert.equal(upgraded.rules[0]?.destination?.url, "https://de.example.com/");
  assert.equal(resolveLinkGeo({ url: "https://default.example.com/", geoDestinations: legacy }, "DE").url, "https://de.example.com/");
});

test("redirect rules keep a legacy destination mirror for the current Prisma relation", () => {
  const mirrored = linkGeoToLegacyDestinations(geo);
  assert.deepEqual(mirrored, [
    {
      id: "rule-de",
      countryCode: "DE",
      countryName: "Germany",
      url: "https://www.instagram.com/linkzzz",
    },
  ]);
});

test("client and server validation reject duplicate countries and incomplete redirects", () => {
  assert.equal(validateLinkGeoConfig(geo), "");

  const duplicate: LinkGeoConfig = {
    ...geo,
    rules: [geo.rules[0]!, { ...geo.rules[1]!, countryCode: "de", countryName: "Germany" }],
  };
  assert.match(validateLinkGeoConfig(duplicate), /only once/i);

  const invalidProfile = createProfile();
  invalidProfile.links[0]!.geo = {
    enabled: true,
    fallback: "SHOW",
    rules: [
      {
        id: "broken",
        countryCode: "DE",
        countryName: "Germany",
        action: "REDIRECT",
      },
    ],
  };
  assert.equal(validateProfilePayload(invalidProfile).ok, false);
  assert.equal(validateProfilePayload(createProfile()).ok, true);
});

function createProfile(): PersistedProfileData {
  return {
    slug: "per-card-geo",
    displayName: "Per-card Geo",
    bio: "",
    status: "PUBLISHED",
    socials: [],
    stats: [],
    contentBlocks: [],
    links: [
      {
        id: "card-1",
        title: "Store",
        url: "https://default.example.com/",
        visible: true,
        geo,
        geoDestinations: [],
      },
    ],
    appearance: structuredClone(defaultAppearance),
  };
}
