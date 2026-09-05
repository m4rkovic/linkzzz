import "server-only";

export type CustomDomainErrorCode =
  | "INVALID_DOMAIN"
  | "DOMAIN_ALREADY_CONNECTED"
  | "DOMAIN_NOT_FOUND"
  | "DOMAIN_NOT_VERIFIED"
  | "DOMAIN_CLAIM_EXPIRED"
  | "DNS_RECORD_NOT_FOUND"
  | "DNS_RECORD_MISMATCH"
  | "SMART_LINK_NOT_FOUND"
  | "SMART_LINK_DISABLED"
  | "INVALID_DOMAIN_ACTION";

export class CustomDomainError extends Error {
  constructor(
    public readonly code: CustomDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CustomDomainError";
  }
}

export function isCustomDomainError(error: unknown): error is CustomDomainError {
  return error instanceof CustomDomainError;
}

export function customDomainErrorStatus(code: CustomDomainErrorCode) {
  switch (code) {
    case "DOMAIN_NOT_FOUND":
    case "SMART_LINK_NOT_FOUND":
      return 404;
    case "DOMAIN_ALREADY_CONNECTED":
    case "DOMAIN_NOT_VERIFIED":
    case "DOMAIN_CLAIM_EXPIRED":
    case "DNS_RECORD_NOT_FOUND":
    case "DNS_RECORD_MISMATCH":
    case "SMART_LINK_DISABLED":
      return 409;
    case "INVALID_DOMAIN":
    case "INVALID_DOMAIN_ACTION":
      return 400;
  }
}
