import assert from "node:assert/strict";
import test from "node:test";

import {
  assessPageCardPlanChange,
  assessSmartLinkPlanChange,
  canCreateSmartLink,
  canSavePageCards,
  getPageCardLimit,
  getSmartLinkLimit,
} from "../src/server/business/plans";
import {
  getAllowedSubscriptionActions,
  getSubscriptionAccess,
  getSubscriptionTransition,
  isSubscriptionRenewalMonths,
  SUBSCRIPTION_RENEWAL_TERMS,
} from "../src/server/business/subscriptions";
import { PLAN_CATALOG } from "../src/features/plans/plan-catalog";

test("plan catalog exposes the current customer-facing prices", () => {
  assert.equal(PLAN_CATALOG.BASIC.priceUsdMonthly, 40);
  assert.equal(PLAN_CATALOG.PRO.priceUsdMonthly, 80);
  assert.equal(PLAN_CATALOG.ENTERPRISE.priceUsdMonthly, 150);
  assert.equal(PLAN_CATALOG.ENTERPRISE.smartLinkDisplay, "200+");
});

test("Smart Link limits follow Basic, Pro and Enterprise capacity", () => {
  assert.equal(getSmartLinkLimit("BASIC"), 50);
  assert.equal(getSmartLinkLimit("PRO"), 100);
  assert.equal(getSmartLinkLimit("ENTERPRISE"), 500);
  assert.equal(canCreateSmartLink("BASIC", 49).allowed, true);
  assert.deepEqual(canCreateSmartLink("BASIC", 50), {
    allowed: false,
    limit: 50,
    currentCount: 50,
    reason: "LINK_LIMIT_REACHED",
  });
});

test("Landing Page Card limits are 10, 30 and 100", () => {
  assert.equal(getPageCardLimit("BASIC"), 10);
  assert.equal(getPageCardLimit("PRO"), 30);
  assert.equal(getPageCardLimit("ENTERPRISE"), 100);
});

test("grandfathered page-card overage can shrink or stay flat but cannot grow", () => {
  assert.deepEqual(canSavePageCards("BASIC", 17, 17), {
    allowed: true,
    limit: 10,
    previousCount: 17,
    nextCount: 17,
    overLimit: true,
  });
  assert.deepEqual(canSavePageCards("BASIC", 17, 12), {
    allowed: true,
    limit: 10,
    previousCount: 17,
    nextCount: 12,
    overLimit: true,
  });
  assert.deepEqual(canSavePageCards("BASIC", 17, 18), {
    allowed: false,
    limit: 10,
    previousCount: 17,
    nextCount: 18,
    overLimit: true,
    reason: "PAGE_CARD_LIMIT_REACHED",
  });
  assert.equal(canSavePageCards("BASIC", 9, 10).allowed, true);
  assert.equal(canSavePageCards("BASIC", 10, 11).allowed, false);
});

test("Page Card downgrade assessment preserves data and reports overage", () => {
  assert.deepEqual(assessPageCardPlanChange("PRO", "BASIC", 17), {
    fromPlan: "PRO",
    toPlan: "BASIC",
    currentCount: 17,
    newLimit: 10,
    exceedsNewLimit: true,
    linksToRemoveBeforeAddingNew: 7,
  });
});

test("Smart Link downgrade assessment reports workspace overage", () => {
  assert.deepEqual(assessSmartLinkPlanChange("ENTERPRISE", "BASIC", 60), {
    fromPlan: "ENTERPRISE",
    toPlan: "BASIC",
    currentCount: 60,
    newLimit: 50,
    exceedsNewLimit: true,
    linksToRemoveBeforeAddingNew: 10,
  });
});

test("subscription renewal terms have one canonical validator", () => {
  assert.deepEqual([...SUBSCRIPTION_RENEWAL_TERMS], [1, 3, 6, 12]);
  for (const months of SUBSCRIPTION_RENEWAL_TERMS) {
    assert.equal(isSubscriptionRenewalMonths(months), true);
  }
  assert.equal(isSubscriptionRenewalMonths(2), false);
  assert.equal(isSubscriptionRenewalMonths("3"), false);
});

test("subscription access uses effective expiry and stop state", () => {
  const now = new Date("2026-09-03T12:00:00.000Z");
  const future = new Date("2026-10-03T12:00:00.000Z");
  const past = new Date("2026-08-03T12:00:00.000Z");

  assert.deepEqual(getSubscriptionAccess("ACTIVE", future, now), {
    hasAccess: true,
  });
  assert.deepEqual(getSubscriptionAccess("CANCEL_AT_PERIOD_END", future, now), {
    hasAccess: true,
  });
  assert.deepEqual(getSubscriptionAccess("ACTIVE", past, now), {
    hasAccess: false,
    reason: "EXPIRED",
  });
  assert.deepEqual(getSubscriptionAccess("EXPIRED", future, now), {
    hasAccess: false,
    reason: "EXPIRED",
  });
  assert.deepEqual(getSubscriptionAccess("STOPPED", future, now), {
    hasAccess: false,
    reason: "STOPPED",
  });
});

test("subscription transitions are enforced from the effective server status", () => {
  const now = new Date("2026-09-03T12:00:00.000Z");
  const future = new Date("2026-10-03T12:00:00.000Z");
  const past = new Date("2026-08-03T12:00:00.000Z");

  assert.deepEqual(getAllowedSubscriptionActions("ACTIVE", future, now), [
    "RENEW",
    "STOP_RENEWAL",
    "STOP_IMMEDIATELY",
    "CHANGE_PLAN",
  ]);
  assert.deepEqual(
    getSubscriptionTransition("ACTIVE", future, "STOP_RENEWAL", now),
    {
      allowed: true,
      effectiveStatus: "ACTIVE",
      nextStatus: "CANCEL_AT_PERIOD_END",
    },
  );
  assert.deepEqual(
    getSubscriptionTransition(
      "CANCEL_AT_PERIOD_END",
      future,
      "RESUME_RENEWAL",
      now,
    ),
    {
      allowed: true,
      effectiveStatus: "CANCEL_AT_PERIOD_END",
      nextStatus: "ACTIVE",
    },
  );

  assert.deepEqual(
    getSubscriptionTransition("ACTIVE", past, "STOP_RENEWAL", now),
    {
      allowed: false,
      effectiveStatus: "EXPIRED",
      reason: "INVALID_TRANSITION",
    },
  );
  assert.deepEqual(
    getSubscriptionTransition("ACTIVE", past, "CHANGE_PLAN", now),
    {
      allowed: true,
      effectiveStatus: "EXPIRED",
      nextStatus: "ACTIVE",
    },
  );
  assert.equal(
    getSubscriptionTransition("STOPPED", future, "RENEW", now).allowed,
    true,
  );
  assert.equal(
    getSubscriptionTransition("STOPPED", future, "RESUME_RENEWAL", now).allowed,
    false,
  );
});
