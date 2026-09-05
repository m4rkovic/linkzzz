import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ProfileRenderer from "@/components/public/profile-renderer";
import { createMockProfileBySlug } from "@/data/mock-profiles";
import { serializeProfile } from "@/features/profile/profile-serialization";

test("classic and visual profile facades both render the existing profile", () => {
  const profile = createMockProfileBySlug("skyhook");
  assert.ok(profile);

  const classic = renderToStaticMarkup(
    createElement(ProfileRenderer, {
      profile: {
        ...profile,
        appearance: { ...profile.appearance, layoutMode: "classic" },
      },
      mode: "preview",
    }),
  );
  const visual = renderToStaticMarkup(
    createElement(ProfileRenderer, {
      profile: {
        ...profile,
        appearance: { ...profile.appearance, layoutMode: "visual" },
      },
      mode: "preview",
    }),
  );

  for (const output of [classic, visual]) {
    assert.match(output, /Sky Hook/);
    assert.match(output, /Listen on Spotify/);
    assert.match(output, /LINKZZZ/);
  }
});

test("profile persistence keeps platform ids without React icon references", () => {
  const profile = createMockProfileBySlug("skyhook");
  assert.ok(profile);

  const persisted = serializeProfile(profile);
  assert.equal(persisted.links[0]?.platform, "spotify");
  assert.equal(persisted.socials[0]?.platform, "instagram");
  assert.equal("icon" in persisted.links[0], false);
  assert.equal("icon" in persisted.socials[0], false);
});
