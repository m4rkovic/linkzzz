import assert from "node:assert/strict";
import test from "node:test";

import {
  createRateLimiter,
  InMemoryRateLimiter,
  RateLimitConfigurationError,
} from "@/server/security/rate-limit";

test("memory limiter enforces and resets a fixed window", async () => {
  const limiter = new InMemoryRateLimiter();
  const policy = { limit: 2, windowMs: 1_000 };

  assert.deepEqual(await limiter.check("visitor", policy, 10_000), {
    allowed: true,
    available: true,
    remaining: 1,
    retryAfterMs: 0,
  });
  assert.equal((await limiter.check("visitor", policy, 10_100)).allowed, true);

  const blocked = await limiter.check("visitor", policy, 10_200);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 800);

  const reset = await limiter.check("visitor", policy, 11_000);
  assert.equal(reset.allowed, true);
  assert.equal(reset.remaining, 1);
});

test("production cannot silently use process memory", () => {
  assert.throws(
    () => createRateLimiter({ RATE_LIMIT_BACKEND: "memory" }, "production"),
    RateLimitConfigurationError,
  );
  assert.throws(
    () => createRateLimiter({}, "production"),
    RateLimitConfigurationError,
  );
});

test("development defaults to the memory adapter", () => {
  assert.ok(createRateLimiter({}, "development") instanceof InMemoryRateLimiter);
});
