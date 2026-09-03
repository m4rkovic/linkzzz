import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProductionEnvironment,
  validateProductionEnvironment,
} from "../src/server/config/production-environment";

const completeEnvironment = {
  DATABASE_URL: "postgresql://linkzzz:secret@db.example.com:5432/linkzzz?sslmode=verify-full",
  RATE_LIMIT_BACKEND: "upstash",
  UPSTASH_REDIS_REST_URL: "https://redis.example.com",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
  RATE_LIMIT_REDIS_TIMEOUT_MS: "2000",
  ASSET_STORAGE_ADAPTER: "s3",
  S3_ENDPOINT: "https://objects.example.com",
  S3_BUCKET: "linkzzz-assets",
  S3_REGION: "auto",
  S3_ACCESS_KEY_ID: "access-key",
  S3_SECRET_ACCESS_KEY: "secret-key",
  S3_PUBLIC_BASE_URL: "https://cdn.example.com",
  LINKZZZ_APP_HOSTS: "linkzzz.com,www.linkzzz.com",
  LINKZZZ_CUSTOM_DOMAIN_TARGET: "domains.linkzzz.com",
  LINKZZZ_TRUST_PROXY_HEADERS: "0",
  LINKZZZ_GEO_HEADER: "x-vercel-ip-country",
  LINKZZZ_ANALYTICS_HASH_SALT: "analytics-secret-with-high-entropy",
};

test("complete production environment passes validation", () => {
  assert.deepEqual(validateProductionEnvironment(completeEnvironment), []);
  assert.doesNotThrow(() => assertProductionEnvironment(completeEnvironment));
});

test("production environment requires shared infrastructure", () => {
  const errors = validateProductionEnvironment({});

  assert.ok(errors.includes("DATABASE_URL is required."));
  assert.ok(errors.includes("RATE_LIMIT_BACKEND must be upstash."));
  assert.ok(errors.includes("ASSET_STORAGE_ADAPTER must be s3."));
  assert.ok(errors.includes("S3_PUBLIC_BASE_URL is required."));
  assert.ok(errors.includes("LINKZZZ_CUSTOM_DOMAIN_TARGET is required."));
  assert.ok(errors.includes("LINKZZZ_GEO_HEADER is required."));
  assert.ok(errors.includes("LINKZZZ_ANALYTICS_HASH_SALT is required."));
});

test("production environment rejects insecure endpoints and invalid hosts", () => {
  const errors = validateProductionEnvironment({
    ...completeEnvironment,
    UPSTASH_REDIS_REST_URL: "http://redis.example.com",
    S3_ENDPOINT: "http://objects.example.com",
    S3_PUBLIC_BASE_URL: "not-a-url",
    LINKZZZ_APP_HOSTS: "https://linkzzz.com/profile",
    LINKZZZ_CUSTOM_DOMAIN_TARGET: "https://domains.linkzzz.com/path",
    LINKZZZ_TRUST_PROXY_HEADERS: "yes",
    LINKZZZ_GEO_HEADER: "bad header name",
  });

  assert.ok(errors.includes("UPSTASH_REDIS_REST_URL must use HTTPS."));
  assert.ok(errors.includes("S3_ENDPOINT must use HTTPS."));
  assert.ok(errors.includes("S3_PUBLIC_BASE_URL must be a valid URL."));
  assert.ok(errors.some((error) => error.startsWith("LINKZZZ_APP_HOSTS")));
  assert.ok(errors.some((error) => error.startsWith("LINKZZZ_CUSTOM_DOMAIN_TARGET")));
  assert.ok(errors.includes("LINKZZZ_TRUST_PROXY_HEADERS must be 0 or 1."));
  assert.ok(errors.includes("LINKZZZ_GEO_HEADER must be a valid HTTP header name."));
});

test("production environment rejects weak analytics salt", () => {
  const errors = validateProductionEnvironment({
    ...completeEnvironment,
    LINKZZZ_ANALYTICS_HASH_SALT: "too-short",
  });
  assert.ok(errors.includes("LINKZZZ_ANALYTICS_HASH_SALT must be at least 32 characters."));
});

test("production environment accepts legacy strict SSL aliases that runtime upgrades", () => {
  const errors = validateProductionEnvironment({
    ...completeEnvironment,
    DATABASE_URL: "postgresql://linkzzz:secret@db.example.com/linkzzz?sslmode=require",
  });

  assert.deepEqual(errors, []);
});

test("production environment rejects localhost and missing certificate verification", () => {
  const localErrors = validateProductionEnvironment({
    ...completeEnvironment,
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/linkzzz",
  });
  const insecureErrors = validateProductionEnvironment({
    ...completeEnvironment,
    DATABASE_URL: "postgresql://linkzzz:secret@db.example.com/linkzzz",
  });

  assert.ok(localErrors.includes(
    "DATABASE_URL must point to a shared PostgreSQL host in production, not localhost.",
  ));
  assert.ok(insecureErrors.includes(
    "DATABASE_URL must use sslmode=verify-full in production.",
  ));
});
