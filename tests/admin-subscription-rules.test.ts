import assert from "node:assert/strict";
import test from "node:test";

import { getDaysUntil, getExpiryLabel, getPlanUsageLabel } from "../src/features/admin/subscription-rules";

test("admin plan usage keeps Enterprise customer-facing 200+ terminology", () => {
  assert.equal(getPlanUsageLabel("BASIC", 32), "32 / 50");
  assert.equal(getPlanUsageLabel("PRO", 57), "57 / 100");
  assert.equal(getPlanUsageLabel("ENTERPRISE", 121), "121 / 200+");
});

test("admin expiry labels expose immediate subscription urgency", () => {
  const now = new Date("2026-09-02T12:00:00Z");
  assert.equal(getDaysUntil(new Date("2026-09-03T12:00:00Z"), now), 1);
  assert.equal(getExpiryLabel(new Date("2026-09-03T12:00:00Z"), now), "Expires tomorrow");
  assert.equal(getExpiryLabel(new Date("2026-09-02T12:00:00Z"), now), "Expires today");
  assert.equal(getExpiryLabel(new Date("2026-08-31T12:00:00Z"), now), "Expired 2 days ago");
});
