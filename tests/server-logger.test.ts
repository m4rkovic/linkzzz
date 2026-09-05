import assert from "node:assert/strict";
import test from "node:test";

import {
  createServerLogEntry,
  getRequestCorrelationId,
} from "@/server/observability/server-logger";

test("structured server logs redact nested credentials", () => {
  const entry = createServerLogEntry({
    level: "error",
    event: "test.failure",
    now: new Date("2026-09-04T12:00:00.000Z"),
    context: {
      userId: "user-1",
      password: "plain-text",
      nested: {
        authorization: "Bearer secret",
        verificationToken: "dns-secret",
      },
    },
    error: new Error("Boom"),
  });

  assert.equal(entry.timestamp, "2026-09-04T12:00:00.000Z");
  assert.equal(entry.event, "test.failure");
  assert.equal(entry.context.password, "[REDACTED]");
  assert.deepEqual(entry.context.nested, {
    authorization: "[REDACTED]",
    verificationToken: "[REDACTED]",
  });
  assert.equal(entry.error?.message, "Boom");
});

test("request correlation IDs accept only bounded safe values", () => {
  assert.equal(
    getRequestCorrelationId({ "x-request-id": "req_123:iad1" }),
    "req_123:iad1",
  );
  assert.equal(
    getRequestCorrelationId({ "x-request-id": "unsafe request id" }),
    undefined,
  );
});

test("request correlation IDs support native Headers without losing method binding", () => {
  const headers = new Headers({
    "x-request-id": "req_native_123",
  });

  assert.equal(getRequestCorrelationId(headers), "req_native_123");
});
