import assert from "node:assert/strict";
import test from "node:test";

import { formatUtcDate } from "../src/lib/date-format";

test("UTC date formatting is stable across day-boundary timestamps", () => {
  assert.equal(formatUtcDate("2026-09-02T23:30:00.000Z"), "Sep 2, 2026");
  assert.equal(
    formatUtcDate("2026-09-03T00:30:00.000Z", { month: "short", day: "2-digit", year: "numeric" }),
    "Sep 03, 2026",
  );
});

test("invalid dates do not leak Invalid Date into the UI", () => {
  assert.equal(formatUtcDate("not-a-date"), "Unknown");
});
