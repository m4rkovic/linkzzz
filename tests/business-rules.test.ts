import assert from "node:assert/strict";
import test from "node:test";

import { assessPlanChange, canCreateLink, getPlanLinkLimit } from "@/server/business/plans";
import { getSubscriptionAccess } from "@/server/business/subscriptions";

test("plan link limits preserve the locked 40/100 rules", () => {
  assert.equal(getPlanLinkLimit("PREMIUM"), 40);
  assert.equal(getPlanLinkLimit("PREMIUM_PLUS"), 100);
  assert.equal(canCreateLink("PREMIUM", 39).allowed, true);
  assert.deepEqual(canCreateLink("PREMIUM", 40), {
    allowed: false,
    limit: 40,
    currentCount: 40,
    reason: "LINK_LIMIT_REACHED",
  });
});

test("downgrade assessment never deletes links and reports the overage", () => {
  assert.deepEqual(assessPlanChange("PREMIUM_PLUS", "PREMIUM", 57), {
    fromPlan: "PREMIUM_PLUS",
    toPlan: "PREMIUM",
    currentCount: 57,
    newLimit: 40,
    exceedsNewLimit: true,
    linksToRemoveBeforeAddingNew: 17,
  });
});

test("subscription access matches active and stopped states", () => {
  assert.deepEqual(getSubscriptionAccess("ACTIVE"), { hasAccess: true });
  assert.deepEqual(getSubscriptionAccess("CANCEL_AT_PERIOD_END"), { hasAccess: true });
  assert.deepEqual(getSubscriptionAccess("EXPIRED"), { hasAccess: false, reason: "EXPIRED" });
  assert.deepEqual(getSubscriptionAccess("STOPPED"), { hasAccess: false, reason: "STOPPED" });
});

test("an end date in the past expires active and cancelling subscriptions", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");
  const past = new Date("2026-09-01T11:59:59.000Z");
  const future = new Date("2026-09-01T12:00:01.000Z");

  assert.deepEqual(getSubscriptionAccess("ACTIVE", past, now), {
    hasAccess: false,
    reason: "EXPIRED",
  });
  assert.deepEqual(getSubscriptionAccess("CANCEL_AT_PERIOD_END", past, now), {
    hasAccess: false,
    reason: "EXPIRED",
  });
  assert.deepEqual(getSubscriptionAccess("ACTIVE", future, now), {
    hasAccess: true,
  });
});
