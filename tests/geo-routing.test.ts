import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import type { PersistedProfileData } from "@/types/persisted-profile";

test("visitor country uses Vercel and Cloudflare ISO country headers", () => {
  assert.equal(
    getVisitorCountryCode(new Headers({ "x-vercel-ip-country": "de" })),
    "DE",
  );
  assert.equal(
    getVisitorCountryCode(new Headers({ "cf-ipcountry": "RS" })),
    "RS",
  );
  assert.equal(
    getVisitorCountryCode(new Headers({ "x-vercel-ip-country": "XX" })),
    null,
  );
  assert.equal(
    getVisitorCountryCode(new Headers({ "x-vercel-ip-country": "invalid" })),
    null,
  );
});

test("geo routing selects the matching destination on the server", () => {
  const profile = createProfile();
  const routed = resolvePublicProfileGeoRouting(profile, "de");

  assert.equal(routed.links[0]?.url, "https://de.example.com/");
  assert.deepEqual(routed.links[0]?.geoDestinations, []);
  assert.equal(profile.links[0]?.url, "https://default.example.com/");
  assert.equal(profile.links[0]?.geoDestinations.length, 2);
});

test("unknown or unmatched countries use the default URL", () => {
  const profile = createProfile();

  assert.equal(
    resolvePublicProfileGeoRouting(profile, "FR").links[0]?.url,
    "https://default.example.com/",
  );
  assert.equal(
    resolvePublicProfileGeoRouting(profile, null).links[0]?.url,
    "https://default.example.com/",
  );
});

function createProfile() {
  return {
    slug: "geo-test",
    displayName: "Geo Test",
    bio: "",
    status: "PUBLISHED",
    socials: [],
    links: [
      {
        id: "link-1",
        title: "Store",
        url: "https://default.example.com/",
        visible: true,
        geoDestinations: [
          {
            id: "geo-de",
            countryCode: "DE",
            countryName: "Germany",
            url: "https://de.example.com/",
          },
          {
            id: "geo-rs",
            countryCode: "RS",
            countryName: "Serbia",
            url: "https://rs.example.com/",
          },
        ],
      },
    ],
    contentBlocks: [],
    appearance: structuredClone(defaultAppearance),
  } satisfies PersistedProfileData;
}
