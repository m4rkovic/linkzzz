const reservedSlugs = new Set([
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

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

export function validateSlug(value: string) {
  const normalized = normalizeSlug(value);

  if (!normalized) {
    return "Slug is required.";
  }

  if (normalized.length < 3) {
    return "Slug must contain at least 3 characters.";
  }

  if (normalized.length > 60) {
    return "Slug cannot exceed 60 characters.";
  }

  if (reservedSlugs.has(normalized)) {
    return "This slug is reserved by Linkzzz.";
  }

  return null;
}
