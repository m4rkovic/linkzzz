import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  DEFAULT_SENSITIVE_CONTENT_WARNING,
  resolveSensitiveContentWarning,
} from "@/features/links/sensitive-content";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

test("sensitive warning is disabled unless a card explicitly enables it", () => {
  assert.equal(resolveSensitiveContentWarning({ sensitiveContent: undefined }), null);
  assert.equal(
    resolveSensitiveContentWarning({ sensitiveContent: { enabled: false } }),
    null,
  );
});

test("sensitive warning resolves configured copy and safe defaults", () => {
  const custom = resolveSensitiveContentWarning({
    sensitiveContent: {
      enabled: true,
      title: " Mature destination ",
      message: " Contains mature material. ",
      continueLabel: " Open anyway ",
    },
  });
  assert.deepEqual(custom, {
    enabled: true,
    title: "Mature destination",
    message: "Contains mature material.",
    continueLabel: "Open anyway",
  });

  assert.deepEqual(
    resolveSensitiveContentWarning({ sensitiveContent: { enabled: true } }),
    { ...DEFAULT_SENSITIVE_CONTENT_WARNING, enabled: true },
  );
});

test("server validation accepts complete sensitive warning and rejects incomplete enabled warning", () => {
  const value = profile();
  assert.equal(validateProfilePayload(value).ok, true);

  const invalid = structuredClone(value);
  invalid.links[0].sensitiveContent = {
    enabled: true,
    title: "",
    message: "Warning",
    continueLabel: "Continue",
  };
  assert.equal(validateProfilePayload(invalid).ok, false);
});

function profile(): PersistedProfileData {
  return {
    slug: "sensitive-demo",
    displayName: "Sensitive Demo",
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
        sensitiveContent: {
          enabled: true,
          title: "Sensitive content",
          message: "This destination contains mature material.",
          continueLabel: "Continue",
        },
        geoDestinations: [],
      },
    ],
    contentBlocks: [],
    appearance: structuredClone(defaultAppearance),
  };
}
