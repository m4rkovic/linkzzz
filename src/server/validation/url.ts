import { invalid, valid, type ValidationResult } from "@/server/validation/result";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function validateExternalUrl(value: string): ValidationResult<string> {
  const trimmed = value.trim();

  if (!trimmed) {
    return invalid("URL is required.");
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    return invalid("URL is invalid.");
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return invalid("Only http and https URLs are allowed.");
  }

  if (!parsed.hostname) {
    return invalid("URL must contain a hostname.");
  }

  return valid(parsed.toString());
}
