export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Development/single-process limiter only.
 * Replace with Redis/KV/shared storage before multi-instance production deployment.
 */
export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private checks = 0;

  check(key: string, policy: RateLimitPolicy, now = Date.now()): RateLimitResult {
    this.checks += 1;
    if (this.checks % 1_000 === 0 || this.buckets.size > 10_000) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }
    const safeLimit = Math.max(1, Math.trunc(policy.limit));
    const safeWindowMs = Math.max(1_000, Math.trunc(policy.windowMs));
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + safeWindowMs,
      });

      return {
        allowed: true,
        remaining: safeLimit - 1,
        retryAfterMs: 0,
      };
    }

    if (existing.count >= safeLimit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, existing.resetAt - now),
      };
    }

    existing.count += 1;

    return {
      allowed: true,
      remaining: Math.max(0, safeLimit - existing.count),
      retryAfterMs: 0,
    };
  }

  clear() {
    this.buckets.clear();
  }
}

export const LOGIN_RATE_LIMIT: RateLimitPolicy = {
  limit: 10,
  windowMs: 15 * 60 * 1_000,
};

export const SENSITIVE_ACTION_RATE_LIMIT: RateLimitPolicy = {
  limit: 20,
  windowMs: 15 * 60 * 1_000,
};

export const ANALYTICS_EVENT_RATE_LIMIT: RateLimitPolicy = {
  limit: 120,
  windowMs: 60 * 1_000,
};

export const IMAGE_UPLOAD_RATE_LIMIT: RateLimitPolicy = {
  limit: 20,
  windowMs: 15 * 60 * 1_000,
};

export const CUSTOM_DOMAIN_RATE_LIMIT: RateLimitPolicy = {
  limit: 30,
  windowMs: 15 * 60 * 1_000,
};
