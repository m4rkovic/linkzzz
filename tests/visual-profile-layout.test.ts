import assert from "node:assert/strict";
import test from "node:test";

import { resolveVisualProfileLayout } from "@/components/public/visual-profile-layout";
import { createMockProfileBySlug } from "@/data/mock-profiles";

function createProfile() {
  const profile = createMockProfileBySlug("skyhook");
  assert.ok(profile);
  return profile;
}

test("visual layout derives the current hero composition without mutating profile data", () => {
  const profile = createProfile();
  const before = structuredClone({
    page: profile.appearance.page,
    hero: profile.appearance.hero,
    identity: profile.appearance.identity,
    cards: profile.appearance.cards,
  });

  const layout = resolveVisualProfileLayout(profile);

  assert.equal(layout.maxWidth, profile.appearance.page?.maxWidth ?? 760);
  assert.equal(layout.heroEnabled, profile.appearance.hero?.enabled ?? false);
  assert.equal(layout.cardGap, profile.appearance.cards?.spacing ?? 12);
  assert.equal(layout.mobileColumns, profile.appearance.page?.mobileColumns ?? 2);
  assert.deepEqual(
    {
      page: profile.appearance.page,
      hero: profile.appearance.hero,
      identity: profile.appearance.identity,
      cards: profile.appearance.cards,
    },
    before,
  );
});

test("visual layout keeps hero visibility and alignment rules in one resolver", () => {
  const profile = createProfile();
  profile.appearance.hero = {
    ...profile.appearance.hero!,
    enabled: true,
    contentPosition: "bottom-left",
    showAvatar: false,
    showSocials: false,
    showStats: false,
    heroTextColor: "#112233",
    heroSecondaryTextColor: "#445566",
  };

  const layout = resolveVisualProfileLayout(profile);

  assert.equal(layout.identityInsideHero, true);
  assert.equal(layout.identityAlignment, "left");
  assert.equal(layout.showAvatar, false);
  assert.equal(layout.showSocials, false);
  assert.equal(layout.showStats, false);
  assert.equal(layout.heroPrimary, "#112233");
  assert.equal(layout.heroSecondary, "#445566");
});

test("visual layout falls back to identity settings when the hero is disabled", () => {
  const profile = createProfile();
  profile.appearance.hero = {
    ...profile.appearance.hero!,
    enabled: false,
    showLocation: false,
    showStats: false,
  };
  profile.appearance.identity = {
    ...profile.appearance.identity!,
    showLocation: true,
    showStats: true,
  };

  const layout = resolveVisualProfileLayout(profile);

  assert.equal(layout.identityInsideHero, false);
  assert.equal(layout.showLocation, true);
  assert.equal(layout.showStats, true);
});
