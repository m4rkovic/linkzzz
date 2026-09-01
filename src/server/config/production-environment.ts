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

  validateDatabaseUrl(environment.DATABASE_URL, errors);
  validateAppHosts(environment.LINKZZZ_APP_HOSTS, errors);

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
    const protocol = new URL(value).protocol;
    if (protocol !== "postgresql:" && protocol !== "postgres:") {
      errors.push("DATABASE_URL must be a PostgreSQL connection URL.");
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
