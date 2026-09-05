type LogLevel = "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /authorization|cookie|password|secret|session|token|verification/i;
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 4_000;

export type ServerLogEntry = {
  timestamp: string;
  level: LogLevel;
  service: "linkzzz";
  event: string;
  context: LogContext;
  error?: LogContext;
};

export function createServerLogEntry(input: {
  level: LogLevel;
  event: string;
  context?: LogContext;
  error?: unknown;
  now?: Date;
}): ServerLogEntry {
  const entry: ServerLogEntry = {
    timestamp: (input.now ?? new Date()).toISOString(),
    level: input.level,
    service: "linkzzz",
    event: input.event,
    context: sanitizeObject(input.context ?? {}),
  };

  if (input.error !== undefined) {
    entry.error = serializeError(input.error);
  }

  return entry;
}

export function logServerInfo(event: string, context: LogContext = {}) {
  writeLog(createServerLogEntry({ level: "info", event, context }));
}

export function logServerWarning(event: string, context: LogContext = {}) {
  writeLog(createServerLogEntry({ level: "warn", event, context }));
}

export function logServerError(
  event: string,
  error: unknown,
  context: LogContext = {},
) {
  writeLog(createServerLogEntry({ level: "error", event, error, context }));
}

export function getRequestCorrelationId(
  headers:
    | { get(name: string): string | null }
    | Record<string, string | string[] | undefined>,
) {
  const headerBag = headers as { get?: (name: string) => string | null };
  const raw = typeof headerBag.get === "function"
    ? headerBag.get("x-request-id") ?? headerBag.get("x-vercel-id")
    : firstHeader(
        (headers as Record<string, string | string[] | undefined>)["x-request-id"] ??
          (headers as Record<string, string | string[] | undefined>)["x-vercel-id"],
      );

  if (!raw || !/^[A-Za-z0-9._:-]{1,128}$/.test(raw)) return undefined;
  return raw;
}

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function writeLog(entry: ServerLogEntry) {
  const serialized = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(serialized);
    return;
  }
  if (entry.level === "warn") {
    console.warn(serialized);
    return;
  }
  console.info(serialized);
}

function serializeError(error: unknown): LogContext {
  if (!(error instanceof Error)) {
    return { value: sanitizeValue(error, 0, new WeakSet()) };
  }

  const output: LogContext = {
    name: error.name,
    message: truncate(error.message),
  };
  if (error.stack) output.stack = truncate(error.stack);
  if ("digest" in error && typeof error.digest === "string") {
    output.digest = truncate(error.digest);
  }
  if (error.cause !== undefined) {
    output.cause = sanitizeValue(error.cause, 0, new WeakSet());
  }
  return output;
}

function sanitizeObject(value: LogContext) {
  return sanitizeValue(value, 0, new WeakSet()) as LogContext;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string") return truncate(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol" || typeof value === "function") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return serializeError(value);
  if (depth >= MAX_DEPTH) return "[MAX_DEPTH]";
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeValue(item, depth + 1, seen));
  }

  const output: LogContext = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = SENSITIVE_KEY.test(key)
      ? REDACTED
      : sanitizeValue(item, depth + 1, seen);
  }
  return output;
}

function truncate(value: string) {
  return value.length <= MAX_STRING_LENGTH
    ? value
    : `${value.slice(0, MAX_STRING_LENGTH)}…`;
}
