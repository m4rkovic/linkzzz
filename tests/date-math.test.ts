import assert from "node:assert/strict";
import test from "node:test";

import { addMonthsClampedUtc } from "../src/server/business/date-math";

test("subscription month math preserves the UTC instant across DST boundaries", () => {
  const start = new Date("2027-09-03T11:20:41.841Z");
  const result = addMonthsClampedUtc(addMonthsClampedUtc(start, 1), 1);

  assert.equal(result.toISOString(), "2027-11-03T11:20:41.841Z");
});

test("subscription month math clamps end-of-month dates in UTC", () => {
  assert.equal(
    addMonthsClampedUtc(new Date("2027-01-31T08:15:00.000Z"), 1).toISOString(),
    "2027-02-28T08:15:00.000Z",
  );
  assert.equal(
    addMonthsClampedUtc(new Date("2028-01-31T08:15:00.000Z"), 1).toISOString(),
    "2028-02-29T08:15:00.000Z",
  );
});
