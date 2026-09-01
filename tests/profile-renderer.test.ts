import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import ProfileRenderer from "@/components/public/profile-renderer";
import { createMockProfileBySlug } from "@/data/mock-profiles";

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
