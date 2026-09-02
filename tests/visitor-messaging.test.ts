import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import { sanitizeEngagementForLinks } from "@/features/engagement/profile-engagement";
import {
  resolveResponseTimeLabel,
  resolveVisitorMessaging,
} from "@/features/engagement/visitor-messaging";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

const profile: PersistedProfileData = {
  slug: "visitor-signals",
  displayName: "Visitor Signals",
  bio: "",
  status: "PUBLISHED",
  socials: [],
  stats: [],
  links: [
    {
      id: "one",
      title: "One",
      url: "https://example.com",
      visible: true,
      geoDestinations: [],
    },
  ],
  contentBlocks: [],
  engagement: {
    visitorMessaging: {
      activeIndicator: "STATIC_ACTIVE",
      responseTime: "TEN_MINUTES",
    },
  },
  appearance: structuredClone(defaultAppearance),
};

test("visitor messaging resolves static active and response-time labels", () => {
  const messaging = resolveVisitorMessaging(profile.engagement);
  assert.equal(messaging.activeIndicator, "STATIC_ACTIVE");
  assert.equal(resolveResponseTimeLabel(profile.engagement), "Usually replies within 10 minutes");
});

test("custom response time trims empty values at runtime", () => {
  assert.equal(
    resolveResponseTimeLabel({
      visitorMessaging: { responseTime: "CUSTOM", customResponseTime: "  Usually replies the same day  " },
    }),
    "Usually replies the same day",
  );
});

test("link cleanup preserves visitor messaging when no featured or campaign link exists", () => {
  const cleaned = sanitizeEngagementForLinks(profile.engagement, []);
  assert.equal(cleaned?.visitorMessaging?.activeIndicator, "STATIC_ACTIVE");
  assert.equal(cleaned?.visitorMessaging?.responseTime, "TEN_MINUTES");
});

test("server validation accepts visitor messaging and rejects empty custom response time", () => {
  assert.equal(validateProfilePayload(profile).ok, true);

  const invalid = structuredClone(profile);
  invalid.engagement = {
    visitorMessaging: {
      activeIndicator: "OFF",
      responseTime: "CUSTOM",
      customResponseTime: "",
    },
  };
  assert.equal(validateProfilePayload(invalid).ok, false);
});
