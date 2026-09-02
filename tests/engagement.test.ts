import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  pinLinkFirst,
  resolveActiveCampaignLink,
  resolveCampaignState,
  resolvePinnedLinkId,
  sanitizeEngagementForLinks,
} from "@/features/engagement/profile-engagement";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type { PublicProfileData } from "@/types/profile";

const NOW = Date.parse("2026-09-02T12:00:00.000Z");

test("active campaign temporarily overrides evergreen featured pin", () => {
  const value = profile();
  assert.equal(resolveCampaignState(value.engagement, NOW), "ACTIVE");
  assert.equal(resolveActiveCampaignLink(value, NOW)?.id, "campaign");
  assert.equal(resolvePinnedLinkId(value, NOW), "campaign");

  const ended = Date.parse("2026-09-04T12:00:00.000Z");
  assert.equal(resolveCampaignState(value.engagement, ended), "ENDED");
  assert.equal(resolvePinnedLinkId(value, ended), "featured");
});

test("pinLinkFirst changes public order without mutating stored order", () => {
  const value = profile();
  const entries = value.links.map((link) => ({ link, state: "ACTIVE" }));
  const reordered = pinLinkFirst(entries, "campaign");

  assert.deepEqual(reordered.map((entry) => entry.link.id), ["campaign", "featured", "other"]);
  assert.deepEqual(value.links.map((link) => link.id), ["featured", "other", "campaign"]);
});

test("ended campaign falls back to featured link automatically", () => {
  const value = profile();
  assert.equal(resolvePinnedLinkId(value, Date.parse("2026-09-03T12:00:00.000Z")), "featured");
});

test("engagement references are cleaned when a selected link is deleted", () => {
  const value = profile();
  const remaining = value.links.filter((link) => link.id !== "campaign");
  const cleaned = sanitizeEngagementForLinks(value.engagement, remaining);

  assert.equal(cleaned?.featuredLinkId, "featured");
  assert.equal(cleaned?.campaign?.primaryLinkId, undefined);
});

test("server validation accepts valid campaign and rejects missing primary link", () => {
  const valid = profile() as PersistedProfileData;
  assert.equal(validateProfilePayload(valid).ok, true);

  const invalid = structuredClone(valid);
  invalid.engagement = {
    ...invalid.engagement,
    campaign: {
      enabled: true,
      focusEffect: "glow",
      dimSiblings: true,
    },
  };
  assert.equal(validateProfilePayload(invalid).ok, false);
});

function profile(): PublicProfileData {
  return {
    slug: "campaign-demo",
    displayName: "Campaign Demo",
    bio: "",
    status: "PUBLISHED",
    socials: [],
    stats: [],
    links: [
      { id: "featured", title: "Featured", url: "https://example.com/featured", visible: true, geoDestinations: [] },
      { id: "other", title: "Other", url: "https://example.com/other", visible: true, geoDestinations: [] },
      { id: "campaign", title: "Campaign", url: "https://example.com/campaign", visible: true, geoDestinations: [] },
    ],
    contentBlocks: [],
    engagement: {
      featuredLinkId: "featured",
      campaign: {
        enabled: true,
        primaryLinkId: "campaign",
        pinPrimary: true,
        focusEffect: "glow-shake",
        dimSiblings: true,
        focusColor: "#8e7dff",
        visibleFrom: "2026-09-02T10:00:00.000Z",
        visibleUntil: "2026-09-03T10:00:00.000Z",
      },
    },
    appearance: structuredClone(defaultAppearance),
  };
}
