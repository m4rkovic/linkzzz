import type { AuthenticatedPrincipal } from "@/server/types/auth";

export class AuthorizationError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "ACCOUNT_UNAVAILABLE";

  constructor(
    code: AuthorizationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export function requireUser(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  if (!principal) {
    throw new AuthorizationError("UNAUTHENTICATED", "Authentication required.");
  }

  return principal;
}

export function requireActiveAccount(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  const user = requireUser(principal);

  if (user.accountStatus !== "ACTIVE") {
    throw new AuthorizationError(
      "ACCOUNT_UNAVAILABLE",
      "Account is not active.",
    );
  }

  return user;
}

export function requireAdmin(
  principal: AuthenticatedPrincipal | null | undefined,
): AuthenticatedPrincipal {
  const user = requireActiveAccount(principal);

  if (user.role !== "ADMIN") {
    throw new AuthorizationError("FORBIDDEN", "Administrator access required.");
  }

  return user;
}

export function requireResourceOwner(
  principal: AuthenticatedPrincipal | null | undefined,
  ownerUserId: string,
): AuthenticatedPrincipal {
  const user = requireActiveAccount(principal);

  if (user.role === "ADMIN") {
    return user;
  }

  if (user.userId !== ownerUserId) {
    throw new AuthorizationError("FORBIDDEN", "Resource access denied.");
  }

  return user;
}
