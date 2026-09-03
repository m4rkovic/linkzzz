import assert from "node:assert/strict";
import test from "node:test";

import {
  createE2EServerEnvironment,
  requireIsolatedE2EDatabaseUrl,
} from "../e2e/environment";

test("E2E database configuration is mandatory", () => {
  assert.throws(
    () => requireIsolatedE2EDatabaseUrl({}),
    /E2E_DATABASE_URL is required/,
  );
});

test("E2E database must differ from the application database", () => {
  assert.throws(
    () =>
      requireIsolatedE2EDatabaseUrl({
        DATABASE_URL: "postgresql://postgres:secret@localhost:5432/linkzzz?schema=public",
        E2E_DATABASE_URL: "postgresql://postgres:secret@localhost:5432/linkzzz?schema=public",
      }),
    /must not be the same database/,
  );
});

test("different credentials cannot disguise the same E2E database", () => {
  assert.throws(
    () =>
      requireIsolatedE2EDatabaseUrl({
        DATABASE_URL: "postgresql://application:one@db.example.test:5432/linkzzz?schema=public",
        E2E_DATABASE_URL: "postgresql://e2e:two@db.example.test/linkzzz?schema=public",
      }),
    /must not be the same database/,
  );
});

test("E2E server gets isolated persistence and local development adapters", () => {
  const environment = createE2EServerEnvironment({
    DATABASE_URL: "postgresql://postgres:secret@localhost:5432/linkzzz?schema=public",
    E2E_DATABASE_URL: "postgresql://postgres:secret@localhost:5432/linkzzz_e2e?schema=public",
    RATE_LIMIT_BACKEND: "upstash",
    ASSET_STORAGE_ADAPTER: "s3",
  });

  assert.match(environment.DATABASE_URL ?? "", /linkzzz_e2e/);
  assert.equal(environment.RATE_LIMIT_BACKEND, "memory");
  assert.equal(environment.ASSET_STORAGE_ADAPTER, "local");
  assert.equal(environment.LINKZZZ_TRUST_PROXY_HEADERS, "1");
  assert.equal(environment.LINKZZZ_GEO_HEADER, "x-vercel-ip-country");
  assert.equal(environment.LINKZZZ_DEV_PREWARM, "0");
  assert.equal(environment.NODE_ENV, "development");
});
