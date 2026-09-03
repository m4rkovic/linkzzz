import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizePostgresConnectionString,
  requireDatabaseConnectionString,
} from "../src/server/config/postgres-connection-string";

test("PostgreSQL connection strings keep explicit verify-full unchanged", () => {
  const input = "postgresql://user:secret@db.example.com/app?sslmode=verify-full&channel_binding=require";
  assert.equal(normalizePostgresConnectionString(input), input);
});

for (const legacyMode of ["prefer", "require", "verify-ca"]) {
  test(`PostgreSQL ${legacyMode} SSL mode is upgraded to verify-full`, () => {
    const normalized = new URL(normalizePostgresConnectionString(
      `postgresql://user:p%40ss@db.example.com/app?schema=public&sslmode=${legacyMode}`,
    ));

    assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
    assert.equal(normalized.searchParams.get("schema"), "public");
    assert.equal(normalized.username, "user");
    assert.equal(normalized.password, "p%40ss");
  });
}

test("PostgreSQL SSL normalization preserves explicit libpq and channel-binding options", () => {
  const normalized = new URL(normalizePostgresConnectionString(
    "postgres://user:secret@db.example.com/app?uselibpqcompat=true&sslmode=require&channel_binding=require",
  ));

  assert.equal(normalized.searchParams.get("sslmode"), "verify-full");
  assert.equal(normalized.searchParams.get("uselibpqcompat"), "true");
  assert.equal(normalized.searchParams.get("channel_binding"), "require");
});

test("local PostgreSQL URLs without an SSL mode are not changed", () => {
  const input = "postgresql://postgres:postgres@localhost:5432/linkzzz?schema=public";
  assert.equal(normalizePostgresConnectionString(input), input);
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
