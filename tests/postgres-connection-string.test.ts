import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePostgresConnectionString,
  requireDatabaseConnectionString,
} from "../src/server/config/postgres-connection-string";

test("PostgreSQL connection strings keep verify-full and force UTC sessions", () => {
  const normalized = new URL(normalizePostgresConnectionString(
    "postgresql://user:secret@db.example.com/app?sslmode=verify-full&channel_binding=require",
  ));

  assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
  assert.equal(normalized.searchParams.get("channel_binding"), "require");
  assert.equal(normalized.searchParams.get("options"), "-c timezone=UTC");
});

for (const legacyMode of ["prefer", "require", "verify-ca"]) {
  test(`PostgreSQL ${legacyMode} SSL mode is upgraded to verify-full`, () => {
    const normalized = new URL(normalizePostgresConnectionString(
      `postgresql://user:p%40ss@db.example.com/app?schema=public&sslmode=${legacyMode}`,
    ));

    assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
    assert.equal(normalized.searchParams.get("schema"), "public");
    assert.equal(normalized.searchParams.get("options"), "-c timezone=UTC");
    assert.equal(normalized.username, "user");
    assert.equal(normalized.password, "p%40ss");
  });
}

test("PostgreSQL normalization preserves existing options and appends UTC last", () => {
  const normalized = new URL(normalizePostgresConnectionString(
    "postgres://user:secret@db.example.com/app?uselibpqcompat=true&sslmode=require&channel_binding=require&options=-c%20statement_timeout%3D5000",
  ));

  assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
  assert.equal(normalized.searchParams.get("uselibpqcompat"), "true");
  assert.equal(normalized.searchParams.get("channel_binding"), "require");
  assert.equal(
    normalized.searchParams.get("options"),
    "-c statement_timeout=5000 -c timezone=UTC",
  );
});

test("PostgreSQL normalization does not duplicate an existing UTC session option", () => {
  const normalized = new URL(normalizePostgresConnectionString(
    "postgresql://postgres:postgres@localhost:5432/linkzzz?options=-c%20timezone%3DUTC",
  ));

  assert.equal(normalized.searchParams.get("options"), "-c timezone=UTC");
});

test("local PostgreSQL URLs also force UTC sessions without adding SSL", () => {
  const normalized = new URL(normalizePostgresConnectionString(
    "postgresql://postgres:postgres@localhost:5432/linkzzz?schema=public",
  ));

  assert.equal(normalized.searchParams.get("schema"), "public");
  assert.equal(normalized.searchParams.get("sslmode"), null);
  assert.equal(normalized.searchParams.get("options"), "-c timezone=UTC");
});

test("required database connection rejects missing and non-PostgreSQL values", () => {
  assert.throws(
    () => requireDatabaseConnectionString({}),
    /DATABASE_URL is required/,
  );
  assert.throws(
    () => normalizePostgresConnectionString("https://db.example.com/app"),
    /must be a PostgreSQL connection URL/,
  );
  assert.throws(
    () => normalizePostgresConnectionString("not a URL"),
    /must be a valid PostgreSQL connection URL/,
  );
});
