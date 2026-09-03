import { normalizePostgresConnectionString } from "./postgres-connection-string";

export type Environment = Record<string, string | undefined>;

export function validateProductionEnvironment(environment: Environment) {
  const errors: string[] = [];

  requireValue(environment, "DATABASE_URL", errors);
  requireExact(environment, "RATE_LIMIT_BACKEND", "upstash", errors);
  requireHttpsUrl(environment, "UPSTASH_REDIS_REST_URL", errors);
  requireValue(environment, "UPSTASH_REDIS_REST_TOKEN", errors);
  validateRateLimitTimeout(environment.RATE_LIMIT_REDIS_TIMEOUT_MS, errors);

  requireExact(environment, "ASSET_STORAGE_ADAPTER", "s3", errors);
  requireHttpsUrl(environment, "S3_ENDPOINT", errors);
  requireValue(environment, "S3_BUCKET", errors);
  requireValue(environment, "S3_ACCESS_KEY_ID", errors);
  requireValue(environment, "S3_SECRET_ACCESS_KEY", errors);
  requireHttpsUrl(environment, "S3_PUBLIC_BASE_URL", errors);
  requireValue(environment, "LINKZZZ_APP_HOSTS", errors);
  requireValue(environment, "LINKZZZ_CUSTOM_DOMAIN_TARGET", errors);
  requireValue(environment, "LINKZZZ_TRUST_PROXY_HEADERS", errors);
  requireValue(environment, "LINKZZZ_ANALYTICS_HASH_SALT", errors);

  validateDatabaseUrl(environment.DATABASE_URL, errors);
  validateAppHosts(environment.LINKZZZ_APP_HOSTS, errors);
  validatePublicHostname(environment.LINKZZZ_CUSTOM_DOMAIN_TARGET, "LINKZZZ_CUSTOM_DOMAIN_TARGET", errors);
  validateBooleanFlag(environment.LINKZZZ_TRUST_PROXY_HEADERS, "LINKZZZ_TRUST_PROXY_HEADERS", errors);
  validateSecretLength(environment.LINKZZZ_ANALYTICS_HASH_SALT, "LINKZZZ_ANALYTICS_HASH_SALT", 32, errors);

  return errors;
}

export function assertProductionEnvironment(environment: Environment) {
  const errors = validateProductionEnvironment(environment);
  if (errors.length) {
    throw new Error(
      `Production environment is not ready:\n- ${errors.join("\n- ")}`,
    );
  }
}

function requireValue(
  environment: Environment,
  name: string,
  errors: string[],
) {
  if (!environment[name]?.trim()) {
    errors.push(`${name} is required.`);
  }
}

function requireExact(
  environment: Environment,
  name: string,
  expected: string,
  errors: string[],
) {
  const value = environment[name]?.trim().toLowerCase();
  if (value !== expected) {
    errors.push(`${name} must be ${expected}.`);
  }
}

function requireHttpsUrl(
  environment: Environment,
  name: string,
  errors: string[],
) {
  const value = environment[name]?.trim();
  if (!value) {
    errors.push(`${name} is required.`);
    return;
  }

  try {
    if (new URL(value).protocol !== "https:") {
      errors.push(`${name} must use HTTPS.`);
    }
  } catch {
    errors.push(`${name} must be a valid URL.`);
  }
}

function validateDatabaseUrl(value: string | undefined, errors: string[]) {
  if (!value?.trim()) return;

  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol;
    if (protocol !== "postgresql:" && protocol !== "postgres:") {
      errors.push("DATABASE_URL must be a PostgreSQL connection URL.");
      return;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
      errors.push("DATABASE_URL must point to a shared PostgreSQL host in production, not localhost.");
      return;
    }

    const normalized = new URL(normalizePostgresConnectionString(value));
    if (normalized.searchParams.get("sslmode")?.toLowerCase() !== "verify-full") {
      errors.push("DATABASE_URL must use sslmode=verify-full in production.");
    }
  } catch {
    errors.push("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }
}

function validateRateLimitTimeout(
  value: string | undefined,
  errors: string[],
) {
  if (!value?.trim()) return;
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 250 || timeout > 10_000) {
    errors.push(
      "RATE_LIMIT_REDIS_TIMEOUT_MS must be an integer between 250 and 10000.",
    );
  }
}

function validateAppHosts(value: string | undefined, errors: string[]) {
  if (!value?.trim()) return;
  const hosts = value.split(",").map((host) => host.trim()).filter(Boolean);
  if (!hosts.length || hosts.some((host) => host.includes("://") || host.includes("/"))) {
    errors.push(
      "LINKZZZ_APP_HOSTS must contain comma-separated hostnames without protocols or paths.",
    );
  }
}
function validatePublicHostname(
  value: string | undefined,
  name: string,
  errors: string[],
) {
  if (!value?.trim()) return;
  const hostname = value.trim().toLowerCase().replace(/\.$/, "");
  if (hostname.includes("://") || hostname.includes("/") || hostname.includes("@") || hostname === "localhost") {
    errors.push(`${name} must be a public hostname without protocol or path.`);
    return;
  }
  const labels = hostname.split(".");
  if (labels.length < 2 || labels.some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    errors.push(`${name} must be a valid public hostname.`);
  }
}

function validateBooleanFlag(
  value: string | undefined,
  name: string,
  errors: string[],
) {
  if (!value?.trim()) return;
  if (value !== "0" && value !== "1") errors.push(`${name} must be 0 or 1.`);
}

function validateSecretLength(
  value: string | undefined,
  name: string,
  minimum: number,
  errors: string[],
) {
  if (!value?.trim()) return;
  if (value.trim().length < minimum) errors.push(`${name} must be at least ${minimum} characters.`);
}
