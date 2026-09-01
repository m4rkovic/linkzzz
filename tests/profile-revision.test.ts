import assert from "node:assert/strict";
import test from "node:test";

import { isValidProfileRevision } from "@/server/profile/profile-revision";

test("profile revisions are positive safe integers", () => {
  assert.equal(isValidProfileRevision(1), true);
  assert.equal(isValidProfileRevision(42), true);
  assert.equal(isValidProfileRevision(0), false);
  assert.equal(isValidProfileRevision(-1), false);
  assert.equal(isValidProfileRevision(1.5), false);
  assert.equal(isValidProfileRevision("1"), false);
  assert.equal(isValidProfileRevision(Number.MAX_SAFE_INTEGER + 1), false);
});
