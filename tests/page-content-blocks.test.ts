import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import { withSmartLinkOutboundRoutes } from "@/server/smart-links/outbound-routing";
import type { PersistedProfileData } from "@/types/persisted-profile";

function profile(): PersistedProfileData {
  return {
    slug: "creator-demo",
    displayName: "Creator Demo",
    bio: "",
    status: "PUBLISHED",
    socials: [],
    links: [],
    stats: [],
    contentBlocks: [
      {
        id: "cta-1",
        type: "CTA",
        visible: true,
        title: "Featured destination",
        description: "Open the main destination",
        buttonText: "Open",
        url: "https://example.com/featured",
        alignment: "center",
        style: "solid",
      },
      {
        id: "capture-1",
        type: "EMAIL_CAPTURE",
        visible: true,
        title: "Stay in the loop",
        placeholder: "you@example.com",
        buttonText: "Join",
        successMessage: "Thanks!",
      },
    ],
    appearance: structuredClone(defaultAppearance),
  };
}

test("page block payload validates and keeps typed blocks", () => {
  const result = validateProfilePayload(profile());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.contentBlocks.length, 2);
});

test("CTA blocks are routed through the SmartLink outbound resolver", () => {
  const routed = withSmartLinkOutboundRoutes(profile(), "creator-demo");
  const block = routed.contentBlocks[0];
  assert.equal(block?.type, "CTA");
  if (block?.type === "CTA") {
    assert.equal(block.url, "/creator-demo/out/block/cta-1");
  }
});

test("unsupported block payloads are rejected", () => {
  const invalid = profile() as unknown as Record<string, unknown>;
  invalid.contentBlocks = [{ id: "bad", type: "SCRIPT", visible: true }];
  assert.equal(validateProfilePayload(invalid).ok, false);
});
