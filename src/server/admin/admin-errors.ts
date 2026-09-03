import "server-only";

export type AdminErrorCode =
  | "INVALID_ADMIN_INPUT"
  | "CUSTOMER_CONFLICT"
  | "CUSTOMER_NOT_FOUND"
  | "SUBSCRIPTION_MISSING"
  | "SUBSCRIPTION_INVALID_STATE"
  | "SUBSCRIPTION_REACTIVATION_REQUIRED"
  | "SMART_LINK_NOT_FOUND"
  | "SMART_LINK_INVALID_STATE"
  | "SMART_LINK_ACCESS_BLOCKED"
  | "SMART_LINK_CONFLICT";

export class AdminError extends Error {
  constructor(
    public readonly code: AdminErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export function isAdminError(error: unknown): error is AdminError {
  return error instanceof AdminError;
}

export function adminErrorStatus(code: AdminErrorCode) {
  switch (code) {
    case "CUSTOMER_NOT_FOUND":
    case "SMART_LINK_NOT_FOUND":
      return 404;
    case "CUSTOMER_CONFLICT":
    case "SUBSCRIPTION_MISSING":
    case "SUBSCRIPTION_INVALID_STATE":
    case "SUBSCRIPTION_REACTIVATION_REQUIRED":
    case "SMART_LINK_INVALID_STATE":
    case "SMART_LINK_ACCESS_BLOCKED":
    case "SMART_LINK_CONFLICT":
      return 409;
    case "INVALID_ADMIN_INPUT":
      return 400;
  }
}
