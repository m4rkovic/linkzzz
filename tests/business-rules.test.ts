import assert from "node:assert/strict";
import test from "node:test";

import {
  assessPlanChange,
  assessSmartLinkPlanChange,
  canCreateLink,
  canCreateSmartLink,
  getPageCardLimit,
  getSmartLinkLimit,
} from "../src/server/business/plans";
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

test("Landing Page link limits are 10, 30 and 100", () => {
  assert.equal(getPageCardLimit("BASIC"), 10);
  assert.equal(getPageCardLimit("PRO"), 30);
  assert.equal(getPageCardLimit("ENTERPRISE"), 100);
  assert.equal(canCreateLink("BASIC", 9).allowed, true);
  assert.deepEqual(canCreateLink("BASIC", 10), {
    allowed: false,
    limit: 10,
    currentCount: 10,
    reason: "LINK_LIMIT_REACHED",
  });
});

test("page-link downgrade assessment preserves data and reports overage", () => {
  assert.deepEqual(assessPlanChange("PRO", "BASIC", 17), {
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
