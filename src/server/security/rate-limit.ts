import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logServerError } from "@/server/observability/server-logger";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  available: boolean;
  remaining: number;
  retryAfterMs: number;
};

export interface RateLimiter {
  check(
    key: string,
    policy: RateLimitPolicy,
    now?: number,
  ): Promise<RateLimitResult>;
}

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitEnvironment = Record<string, string | undefined>;

export class RateLimitConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitConfigurationError";
  }
}

/** Development and test adapter. It is intentionally never selected in production. */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private checks = 0;

  async check(
    key: string,
    policy: RateLimitPolicy,
    now = Date.now(),
  ): Promise<RateLimitResult> {
    this.checks += 1;
    if (this.checks % 1_000 === 0 || this.buckets.size > 10_000) {
      for (const [bucketKey, bucket] of this.buckets) {
        if (bucket.resetAt <= now) this.buckets.delete(bucketKey);
      }
    }

    const { limit, windowMs } = normalizePolicy(policy);
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        available: true,
        remaining: limit - 1,
        retryAfterMs: 0,
      };
    }

    if (existing.count >= limit) {
      return {
        allowed: false,
        available: true,
        remaining: 0,
        retryAfterMs: Math.max(0, existing.resetAt - now),
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      available: true,
      remaining: Math.max(0, limit - existing.count),
      retryAfterMs: 0,
    };
  }

  clear() {
    this.buckets.clear();
  }
}

export class UpstashRateLimiter implements RateLimiter {
  private readonly limiters = new Map<string, Ratelimit>();

  constructor(
    private readonly redis: Redis,
    private readonly timeoutMs = 2_000,
  ) {}

  async check(
    key: string,
    policy: RateLimitPolicy,
    now = Date.now(),
  ): Promise<RateLimitResult> {
    const { limit, windowMs } = normalizePolicy(policy);
    const policyKey = `${limit}:${windowMs}`;
    let limiter = this.limiters.get(policyKey);

    if (!limiter) {
      limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.fixedWindow(limit, `${windowMs} ms`),
        prefix: `linkzzz:rate-limit:${limit}:${windowMs}`,
        analytics: false,
        ephemeralCache: new Map(),
        // Disable the SDK's fail-open timeout. The wrapper below fails closed.
        timeout: 0,
      });
      this.limiters.set(policyKey, limiter);
    }

    const response = await withTimeout(
      limiter.limit(hashIdentifier(key)),
      this.timeoutMs,
    );

    return {
      allowed: response.success,
      available: true,
      remaining: Math.max(0, response.remaining),
      retryAfterMs: response.success ? 0 : Math.max(0, response.reset - now),
    };
  }
}

let sharedRateLimiter: RateLimiter | undefined;
let didReportUnavailable = false;

export async function checkRateLimit(
  key: string,
  policy: RateLimitPolicy,
): Promise<RateLimitResult> {
  try {
    sharedRateLimiter ??= createRateLimiter(process.env, process.env.NODE_ENV);
    const result = await sharedRateLimiter.check(key, policy);
    didReportUnavailable = false;
    return result;
  } catch (error) {
    if (!didReportUnavailable) {
      didReportUnavailable = true;
      logServerError("rate_limit.backend_unavailable", error, {
        outcome: "protected_request_rejected",
      });
    }

    return {
      allowed: false,
      available: false,
      remaining: 0,
      retryAfterMs: 0,
    };
  }
}

export function createRateLimiter(
  environment: RateLimitEnvironment,
  nodeEnvironment: string | undefined,
): RateLimiter {
  const configuredBackend = environment.RATE_LIMIT_BACKEND?.trim().toLowerCase();
  const backend = configuredBackend || (nodeEnvironment === "production" ? "upstash" : "memory");

  if (backend === "memory") {
    if (nodeEnvironment === "production") {
      throw new RateLimitConfigurationError(
        "RATE_LIMIT_BACKEND=memory is not allowed in production.",
      );
    }
    return new InMemoryRateLimiter();
  }

  if (backend !== "upstash") {
    throw new RateLimitConfigurationError(
      "RATE_LIMIT_BACKEND must be either memory or upstash.",
    );
  }

  const url = environment.UPSTASH_REDIS_REST_URL?.trim();
  const token = environment.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    throw new RateLimitConfigurationError(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.",
    );
  }

  validateRedisUrl(url, nodeEnvironment);
  const timeoutMs = normalizeTimeout(environment.RATE_LIMIT_REDIS_TIMEOUT_MS);
  return new UpstashRateLimiter(new Redis({ url, token }), timeoutMs);
}

function normalizePolicy(policy: RateLimitPolicy) {
  return {
    limit: Math.max(1, Math.trunc(policy.limit)),
    windowMs: Math.max(1_000, Math.trunc(policy.windowMs)),
  };
}

function normalizeTimeout(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 250 && parsed <= 10_000
    ? Math.trunc(parsed)
    : 2_000;
}

function validateRedisUrl(value: string, nodeEnvironment: string | undefined) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new RateLimitConfigurationError("UPSTASH_REDIS_REST_URL is invalid.");
  }

  if (nodeEnvironment === "production" && parsed.protocol !== "https:") {
    throw new RateLimitConfigurationError(
      "UPSTASH_REDIS_REST_URL must use HTTPS in production.",
    );
  }
}

function hashIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Rate-limit backend timed out.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export const LOGIN_RATE_LIMIT: RateLimitPolicy = {
  limit: 10,
  windowMs: 15 * 60 * 1_000,
};

export const SMART_LINK_CREATE_RATE_LIMIT: RateLimitPolicy = {
  limit: 10,
  windowMs: 60 * 1_000,
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

export const LEAD_CAPTURE_RATE_LIMIT: RateLimitPolicy = {
  limit: 12,
  windowMs: 15 * 60 * 1_000,
};
