const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const LEGACY_STRICT_SSL_MODES = new Set(["prefer", "require", "verify-ca"]);
const POSTGRES_UTC_OPTION = "-c timezone=UTC";

/**
 * Normalize application-owned PostgreSQL connections before they reach pg.
 *
 * - pg-connection-string 8.x currently treats prefer, require and verify-ca as
 *   verify-full, but pg 9 will adopt the weaker libpq meanings. Keep today's
 *   strict certificate behavior explicit.
 * - Prisma 7's @prisma/adapter-pg has known TIMESTAMPTZ read/write skew when
 *   the PostgreSQL session timezone is not UTC. Force every application-owned
 *   session to UTC so persisted DateTime values remain absolute instants.
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
  if (sslMode && LEGACY_STRICT_SSL_MODES.has(sslMode)) {
    parsed.searchParams.set("sslmode", "verify-full");
  }

  const options = parsed.searchParams.get("options")?.trim() ?? "";
  if (!/(?:^|\s)-c\s+timezone=utc(?:\s|$)/i.test(options)) {
    parsed.searchParams.set(
      "options",
      options ? `${options} ${POSTGRES_UTC_OPTION}` : POSTGRES_UTC_OPTION,
    );
  }

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
