import { invalid, valid, type ValidationResult } from "@/server/validation/result";

export const RESERVED_SLUGS = new Set([
  "admin",
  "dashboard",
  "login",
  "logout",
  "api",
  "settings",
  "analytics",
  "account",
  "support",
  "static",
  "uploads",
  "change-password",
  "_next",
]);

export const SLUG_PATTERN = /^[a-z0-9_-]+$/;

export function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export function validateSlug(value: string): ValidationResult<string> {
  const normalized = normalizeSlug(value);

  if (!normalized) {
    return invalid("Slug is required.");
  }

  if (normalized.length < 3) {
    return invalid("Slug must contain at least 3 characters.");
  }

  if (normalized.length > 60) {
    return invalid("Slug cannot exceed 60 characters.");
  }

  if (!SLUG_PATTERN.test(normalized)) {
    return invalid("Slug may contain only lowercase letters, numbers, hyphens and underscores.");
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return invalid("This slug is reserved by Linkzzz.");
  }

  return valid(normalized);
}
