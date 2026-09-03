import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeGa4MeasurementId,
  normalizeMetaPixelId,
} from "@/features/tracking/tracking-identifiers";

test("tracking identifiers normalize valid persisted values", () => {
  assert.equal(normalizeGa4MeasurementId(" g-abc12345 "), "G-ABC12345");
  assert.equal(normalizeMetaPixelId(" 1234567890 "), "1234567890");
});

test("tracking identifiers reject invalid persisted values before script rendering", () => {
  assert.equal(normalizeGa4MeasurementId("UA-OLD-ID"), null);
  assert.equal(normalizeGa4MeasurementId("G-ABC');alert(1);//"), null);
  assert.equal(normalizeMetaPixelId("12345');alert(1);//"), null);
  assert.equal(normalizeMetaPixelId(123456), null);
});
