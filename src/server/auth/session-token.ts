import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const SHORT_SESSION_DURATION_MS = 12 * 60 * 60 * 1_000;
export const REMEMBERED_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1_000;

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function getSessionExpiry(
  rememberMe: boolean,
  now = new Date(),
) {
  const duration = rememberMe
    ? REMEMBERED_SESSION_DURATION_MS
    : SHORT_SESSION_DURATION_MS;

  return new Date(now.getTime() + duration);
}
