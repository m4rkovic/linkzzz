import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import type { PersistedProfileData } from "@/types/persisted-profile";

test("visitor country uses only the explicitly configured trusted geo header", () => {
  const previousTrust = process.env.LINKZZZ_TRUST_PROXY_HEADERS;
  const previousHeader = process.env.LINKZZZ_GEO_HEADER;
  try {
    process.env.LINKZZZ_TRUST_PROXY_HEADERS = "1";
    process.env.LINKZZZ_GEO_HEADER = "x-vercel-ip-country";
    assert.equal(
      getVisitorCountryCode(new Headers({
        "x-vercel-ip-country": "de",
        "cf-ipcountry": "RS",
      })),
      "DE",
    );
    assert.equal(
      getVisitorCountryCode(new Headers({ "cf-ipcountry": "RS" })),
      null,
    );

    process.env.LINKZZZ_GEO_HEADER = "cf-ipcountry";
    assert.equal(
      getVisitorCountryCode(new Headers({ "cf-ipcountry": "RS" })),
      "RS",
    );
    assert.equal(
      getVisitorCountryCode(new Headers({ "cf-ipcountry": "XX" })),
      null,
    );
    assert.equal(
      getVisitorCountryCode(new Headers({ "cf-ipcountry": "invalid" })),
      null,
    );
  } finally {
    restoreEnvironment("LINKZZZ_TRUST_PROXY_HEADERS", previousTrust);
    restoreEnvironment("LINKZZZ_GEO_HEADER", previousHeader);
  }
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

test("visitor geo headers are ignored unless proxy trust and a valid header name are configured", () => {
  const previousTrust = process.env.LINKZZZ_TRUST_PROXY_HEADERS;
  const previousHeader = process.env.LINKZZZ_GEO_HEADER;
  const headers = new Headers({ "x-vercel-ip-country": "DE" });
  try {
    process.env.LINKZZZ_TRUST_PROXY_HEADERS = "0";
    process.env.LINKZZZ_GEO_HEADER = "x-vercel-ip-country";
    assert.equal(getVisitorCountryCode(headers), null);

    process.env.LINKZZZ_TRUST_PROXY_HEADERS = "1";
    delete process.env.LINKZZZ_GEO_HEADER;
    assert.equal(getVisitorCountryCode(headers), null);

    process.env.LINKZZZ_GEO_HEADER = "not a header";
    assert.equal(getVisitorCountryCode(headers), null);
  } finally {
    restoreEnvironment("LINKZZZ_TRUST_PROXY_HEADERS", previousTrust);
    restoreEnvironment("LINKZZZ_GEO_HEADER", previousHeader);
  }
});

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
