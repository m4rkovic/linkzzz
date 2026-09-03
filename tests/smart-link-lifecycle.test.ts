import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDuplicateTitle,
  canCustomerDeleteSmartLink,
  canDeleteWithoutRemovingLastLandingPage,
  duplicateSlugCandidates,
} from "../src/server/smart-links/smart-link-lifecycle";

test("duplicate title stays within SmartLink title limit", () => {
  const title = buildDuplicateTitle("x".repeat(120));
  assert.equal(title.length, 120);
  assert.match(title, / copy$/);
});

test("duplicate slug candidates are deterministic, unique and <= 40 chars", () => {
  const candidates = duplicateSlugCandidates("summer-campaign-" + "x".repeat(40), 3);
  assert.deepEqual(candidates.length, 3);
  assert.equal(new Set(candidates).size, 3);
  assert.ok(candidates.every((value) => value.length <= 40));
  assert.match(candidates[0]!, /-copy$/);
  assert.match(candidates[1]!, /-copy-2$/);
});

test("customers may only delete draft SmartLinks", () => {
  assert.equal(canCustomerDeleteSmartLink("DRAFT"), true);
  assert.equal(canCustomerDeleteSmartLink("PUBLISHED"), false);
  assert.equal(canCustomerDeleteSmartLink("DISABLED"), false);
});

test("the final Landing Page cannot be removed while Direct links remain deletable", () => {
  assert.equal(canDeleteWithoutRemovingLastLandingPage("LANDING_PAGE", 1), false);
  assert.equal(canDeleteWithoutRemovingLastLandingPage("LANDING_PAGE", 2), true);
  assert.equal(canDeleteWithoutRemovingLastLandingPage("DIRECT", 0), true);
});
