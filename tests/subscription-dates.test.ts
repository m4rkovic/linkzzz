import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSubscriptionDateInput,
  parseSubscriptionDateInput,
} from "../src/server/business/subscription-dates";
import { getEffectiveSubscriptionStatus } from "../src/server/business/subscriptions";

test("subscription date input persists the selected calendar day at UTC noon", () => {
  assert.equal(
    parseSubscriptionDateInput("2027-03-28")?.toISOString(),
    "2027-03-28T12:00:00.000Z",
  );
  assert.equal(
    parseSubscriptionDateInput("2027-10-31")?.toISOString(),
    "2027-10-31T12:00:00.000Z",
  );
});

test("subscription date input rejects timestamps and impossible calendar dates", () => {
  assert.equal(parseSubscriptionDateInput("2027-03-28T12:00:00Z"), null);
  assert.equal(parseSubscriptionDateInput("2027-02-29"), null);
  assert.equal(parseSubscriptionDateInput("not-a-date"), null);
});

test("subscription date formatting is UTC-based", () => {
  assert.equal(
    formatSubscriptionDateInput(new Date("2027-03-28T23:30:00.000Z")),
    "2027-03-28",
  );
  assert.equal(formatSubscriptionDateInput(new Date(Number.NaN)), "");
});

test("effective subscription status derives expiry from the instant boundary", () => {
  const expiresAt = new Date("2027-09-03T12:00:00.000Z");

  assert.equal(
    getEffectiveSubscriptionStatus(
      "ACTIVE",
      expiresAt,
      new Date("2027-09-03T11:59:59.999Z"),
    ),
    "ACTIVE",
  );
  assert.equal(
    getEffectiveSubscriptionStatus(
      "CANCEL_AT_PERIOD_END",
      expiresAt,
      new Date("2027-09-03T12:00:00.000Z"),
    ),
    "EXPIRED",
  );
  assert.equal(
    getEffectiveSubscriptionStatus(
      "STOPPED",
      new Date("2099-01-01T12:00:00.000Z"),
      new Date("2027-09-03T12:00:00.000Z"),
    ),
    "STOPPED",
  );
});
