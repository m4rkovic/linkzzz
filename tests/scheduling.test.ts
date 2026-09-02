import assert from "node:assert/strict";
import test from "node:test";

import { defaultAppearance } from "@/config/profile-defaults";
import {
  isLinkNavigable,
  isLinkRendered,
  resolveLinkAvailability,
} from "@/features/links/link-availability";
import { resolveScheduleWindow } from "@/features/scheduling/schedule";
import { validateProfilePayload } from "@/server/profile/profile-validation";
import type { PersistedProfileData } from "@/types/persisted-profile";

const NOW = Date.parse("2026-09-02T12:00:00.000Z");

test("schedule window transitions at start and end boundaries", () => {
  const schedule = {
    visibleFrom: "2026-09-02T13:00:00.000Z",
    visibleUntil: "2026-09-02T15:00:00.000Z",
  };

  assert.equal(resolveScheduleWindow(schedule, NOW), "UPCOMING");
  assert.equal(resolveScheduleWindow(schedule, Date.parse(schedule.visibleFrom)), "ACTIVE");
  assert.equal(resolveScheduleWindow(schedule, Date.parse(schedule.visibleUntil)), "ENDED");
});

test("expired cards can hide or remain visibly disabled", () => {
  const base = {
    visible: true,
    availability: { visibleUntil: "2026-09-02T11:00:00.000Z", expiryAction: "HIDE" as const },
  };

  const hidden = resolveLinkAvailability(base, NOW);
  assert.equal(hidden, "EXPIRED_HIDDEN");
  assert.equal(isLinkRendered(hidden), false);
  assert.equal(isLinkNavigable(hidden), false);

  const disabled = resolveLinkAvailability(
    { ...base, availability: { ...base.availability, expiryAction: "DISABLE" as const } },
    NOW,
  );
  assert.equal(disabled, "EXPIRED_DISABLED");
  assert.equal(isLinkRendered(disabled), true);
  assert.equal(isLinkNavigable(disabled), false);
});

test("profile validation accepts countdown and scheduled cards", () => {
  const result = validateProfilePayload(profile());
  assert.equal(result.ok, true);
});

test("profile validation rejects inverted schedule windows", () => {
  const invalid = profile();
  invalid.links[0]!.availability = {
    visibleFrom: "2026-09-03T10:00:00.000Z",
    visibleUntil: "2026-09-03T09:00:00.000Z",
    expiryAction: "HIDE",
  };
  assert.equal(validateProfilePayload(invalid).ok, false);
});

function profile(): PersistedProfileData {
  return {
    slug: "scheduled-demo",
    displayName: "Scheduled Demo",
    bio: "",
    status: "PUBLISHED",
    socials: [],
    stats: [],
    links: [
      {
        id: "card-1",
        title: "Launch",
        url: "https://example.com/launch",
        visible: true,
        availability: {
          visibleFrom: "2026-09-02T13:00:00.000Z",
          visibleUntil: "2026-09-03T13:00:00.000Z",
          expiryAction: "DISABLE",
        },
        geoDestinations: [],
      },
    ],
    contentBlocks: [
      {
        id: "countdown-1",
        type: "COUNTDOWN",
        visible: true,
        title: "Launch in",
        targetAt: "2026-09-03T13:00:00.000Z",
        completionText: "We are live",
        alignment: "center",
        surface: "card",
        visibleFrom: "2026-09-02T12:00:00.000Z",
        visibleUntil: "2026-09-04T12:00:00.000Z",
      },
    ],
    appearance: structuredClone(defaultAppearance),
  };
}
