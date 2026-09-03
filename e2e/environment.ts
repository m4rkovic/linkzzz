import "dotenv/config";

import { normalizePostgresConnectionString } from "../src/server/config/postgres-connection-string";

type Environment = Record<string, string | undefined>;

export function requireIsolatedE2EDatabaseUrl(
  environment: Environment = process.env,
) {
  const configured = environment.E2E_DATABASE_URL?.trim();
  if (!configured) {
    throw new Error(
      "E2E_DATABASE_URL is required. Point it at a disposable PostgreSQL database that is separate from DATABASE_URL.",
    );
  }

  const e2eDatabaseUrl = normalizePostgresConnectionString(configured);
  const applicationDatabaseUrl = environment.DATABASE_URL?.trim();

  if (
    applicationDatabaseUrl &&
    databaseIdentity(e2eDatabaseUrl) ===
      databaseIdentity(normalizePostgresConnectionString(applicationDatabaseUrl))
  ) {
    throw new Error(
      "E2E_DATABASE_URL must not be the same database as DATABASE_URL. The E2E suite migrates, seeds and removes test-owned rows.",
    );
  }

  return e2eDatabaseUrl;
}

export function createE2EServerEnvironment(
  environment: Environment = process.env,
): NodeJS.ProcessEnv {
  const nodeEnvironment = environment.NODE_ENV === "test"
    ? "test"
    : "development";
  return {
    ...environment,
    NODE_ENV: nodeEnvironment,
    DATABASE_URL: requireIsolatedE2EDatabaseUrl(environment),
    RATE_LIMIT_BACKEND: "memory",
    ASSET_STORAGE_ADAPTER: "local",
    LINKZZZ_TRUST_PROXY_HEADERS: "1",
    LINKZZZ_DEV_PREWARM: "0",
    NEXT_TELEMETRY_DISABLED: "1",
  };
}

function databaseIdentity(value: string) {
  const parsed = new URL(value);
  const port = parsed.port || "5432";
  const schema = parsed.searchParams.get("schema")?.trim() || "public";
  return `${parsed.hostname.toLowerCase()}:${port}${parsed.pathname}?schema=${schema}`;
}
