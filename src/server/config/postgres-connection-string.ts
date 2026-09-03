const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const LEGACY_STRICT_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);

/**
 * Preserve node-postgres 8.x's current strict certificate behavior explicitly.
 *
 * pg-connection-string currently treats prefer, require and verify-ca as
 * verify-full, but pg 9 will adopt the weaker libpq meanings for those values.
 * Normalizing every application-owned connection path keeps today's secure
 * behavior, removes the deprecation warning and makes the upgrade deterministic.
 */
export function normalizePostgresConnectionString(value: string) {
  const connectionString = value.trim();
  let parsed: URL;

  try {
    parsed = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
  }

  const sslMode = parsed.searchParams.get("sslmode")?.trim().toLowerCase();
  if (!sslMode || !LEGACY_STRICT_SSL_MODES.has(sslMode)) {
    return connectionString;
  }

  parsed.searchParams.set("sslmode", "verify-full");
  return parsed.toString();
}

export function requireDatabaseConnectionString(
  environment: Record<string, string | undefined> = process.env,
) {
  const value = environment.DATABASE_URL;
  if (!value?.trim()) {
    throw new Error("DATABASE_URL is required for Prisma/PostgreSQL persistence.");
  }
  return normalizePostgresConnectionString(value);
}
