import "server-only";

import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { ensureDevelopmentAuthSeeded } from "@/server/auth/dev-seed";
import { passwordHasher } from "@/server/auth/password-hasher";
import {
  createSessionToken,
  getSessionExpiry,
  hashSessionToken,
} from "@/server/auth/session-token";
import { getServerDependencies } from "@/server/persistence/dependencies";
import {
  checkRateLimit,
  LOGIN_RATE_LIMIT,
  SENSITIVE_ACTION_RATE_LIMIT,
} from "@/server/security/rate-limit";
import type { UserRecord } from "@/server/services/contracts";
import type { AuthenticatedPrincipal } from "@/server/types/auth";
import { validatePassword } from "@/server/validation/password";

export type AuthenticatedSession = {
  sessionId: string;
  user: UserRecord;
  principal: AuthenticatedPrincipal;
  expiresAt: Date;
  mustChangePassword: boolean;
};

export type LoginResult =
  | {
      ok: true;
      token: string;
      session: AuthenticatedSession;
    }
  | {
      ok: false;
      code:
        | "INVALID_CREDENTIALS"
        | "ACCOUNT_UNAVAILABLE"
        | "SUBSCRIPTION_UNAVAILABLE"
        | "RATE_LIMIT_UNAVAILABLE"
        | "RATE_LIMITED";
      retryAfterMs?: number;
    };

export type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "INVALID_CURRENT_PASSWORD"
        | "INVALID_NEW_PASSWORD"
        | "PASSWORD_UNCHANGED"
        | "RATE_LIMIT_UNAVAILABLE"
        | "RATE_LIMITED";
      message?: string;
      retryAfterMs?: number;
    };

function toPrincipal(user: UserRecord): AuthenticatedPrincipal {
  return {
    userId: user.id,
    role: user.role,
    accountStatus: user.accountStatus,
  };
}

export async function loginWithPassword(input: {
  identifier: string;
  password: string;
  rememberMe: boolean;
  requestKey: string;
}): Promise<LoginResult> {
  await ensureDevelopmentAuthSeeded();

  const normalizedIdentifier = input.identifier.trim().toLowerCase();
  const rateLimit = await checkRateLimit(
    `${input.requestKey}:${normalizedIdentifier || "empty"}`,
    LOGIN_RATE_LIMIT,
  );

  if (!rateLimit.available) {
    return { ok: false, code: "RATE_LIMIT_UNAVAILABLE" };
  }

  if (!rateLimit.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterMs: rateLimit.retryAfterMs,
    };
  }

  const dependencies = await getServerDependencies();
  await dependencies.sessions.deleteExpired(new Date());
  const user = await dependencies.users.findByLogin(normalizedIdentifier);

  if (!user) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const passwordHash = await dependencies.passwords.getPasswordHash(user.id);

  if (!passwordHash) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  const validPassword = await passwordHasher.verify(input.password, passwordHash);

  if (!validPassword) {
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  if (user.accountStatus !== "ACTIVE") {
    return { ok: false, code: "ACCOUNT_UNAVAILABLE" };
  }

  const [subscription, mustChangePassword] = await Promise.all([
    user.role === "CUSTOMER"
      ? dependencies.subscriptions.findByUserId(user.id)
      : Promise.resolve(null),
    dependencies.passwords.getMustChangePassword(user.id),
  ]);

  if (user.role === "CUSTOMER") {
    if (
      !subscription ||
      !getSubscriptionAccess(subscription.status, subscription.expiresAt).hasAccess
    ) {
      return { ok: false, code: "SUBSCRIPTION_UNAVAILABLE" };
    }
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiry(input.rememberMe);
  const created = await dependencies.sessions.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await dependencies.audit.write({
    actorUserId: user.id,
    targetUserId: user.id,
    action: "LOGIN_SUCCEEDED",
    resourceType: "SESSION",
    resourceId: created.id,
  });

  return {
    ok: true,
    token,
    session: {
      sessionId: created.id,
      user,
      principal: toPrincipal(user),
      expiresAt,
      mustChangePassword,
    },
  };
}

export async function resolveSessionToken(
  token: string | null | undefined,
  options: { allowPasswordChangeRequired?: boolean } = {},
): Promise<AuthenticatedSession | null> {
  if (!token) {
    return null;
  }

  await ensureDevelopmentAuthSeeded();

  const dependencies = await getServerDependencies();
  const tokenHash = hashSessionToken(token);
  const session = await dependencies.sessions.findValidByTokenHash(
    tokenHash,
    new Date(),
  );

  if (!session) {
    return null;
  }

  const user = await dependencies.users.findById(session.userId);

  if (!user || user.accountStatus !== "ACTIVE") {
    await dependencies.sessions.revokeById(session.id);
    return null;
  }

  const [subscription, mustChangePassword] = await Promise.all([
    user.role === "CUSTOMER"
      ? dependencies.subscriptions.findByUserId(user.id)
      : Promise.resolve(null),
    dependencies.passwords.getMustChangePassword(user.id),
  ]);

  if (user.role === "CUSTOMER") {
    if (
      !subscription ||
      !getSubscriptionAccess(subscription.status, subscription.expiresAt).hasAccess
    ) {
      await dependencies.sessions.revokeById(session.id);
      return null;
    }
  }

  if (mustChangePassword && !options.allowPasswordChangeRequired) {
    return null;
  }

  return {
    sessionId: session.id,
    user,
    principal: toPrincipal(user),
    expiresAt: session.expiresAt,
    mustChangePassword,
  };
}

export async function logoutSession(token: string | null | undefined) {
  if (!token) {
    return;
  }

  const dependencies = await getServerDependencies();
  const session = await dependencies.sessions.findValidByTokenHash(
    hashSessionToken(token),
    new Date(),
  );

  if (!session) {
    return;
  }

  await dependencies.sessions.revokeById(session.id);

  await dependencies.audit.write({
    actorUserId: session.userId,
    targetUserId: session.userId,
    action: "LOGOUT",
    resourceType: "SESSION",
    resourceId: session.id,
  });
}

export async function changePassword(input: {
  session: AuthenticatedSession;
  currentPassword: string;
  newPassword: string;
  requestKey: string;
}): Promise<ChangePasswordResult> {
  const rateLimit = await checkRateLimit(
    `change-password:${input.session.user.id}:${input.requestKey}`,
    SENSITIVE_ACTION_RATE_LIMIT,
  );

  if (!rateLimit.available) {
    return { ok: false, code: "RATE_LIMIT_UNAVAILABLE" };
  }

  if (!rateLimit.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterMs: rateLimit.retryAfterMs,
    };
  }

  const passwordValidation = validatePassword(input.newPassword);

  if (!passwordValidation.ok) {
    return {
      ok: false,
      code: "INVALID_NEW_PASSWORD",
      message: passwordValidation.error,
    };
  }

  if (input.currentPassword === input.newPassword) {
    return { ok: false, code: "PASSWORD_UNCHANGED" };
  }

  const dependencies = await getServerDependencies();
  const currentHash = await dependencies.passwords.getPasswordHash(
    input.session.user.id,
  );

  if (!currentHash) {
    return { ok: false, code: "INVALID_CURRENT_PASSWORD" };
  }

  const currentMatches = await passwordHasher.verify(
    input.currentPassword,
    currentHash,
  );

  if (!currentMatches) {
    return { ok: false, code: "INVALID_CURRENT_PASSWORD" };
  }

  const newHash = await passwordHasher.hash(input.newPassword);
  await dependencies.passwords.setPasswordHash(input.session.user.id, newHash);
  await dependencies.passwords.setMustChangePassword(input.session.user.id, false);
  await dependencies.sessions.revokeAllForUser(input.session.user.id);

  await dependencies.audit.write({
    actorUserId: input.session.user.id,
    targetUserId: input.session.user.id,
    action: "PASSWORD_CHANGED",
    resourceType: "USER",
    resourceId: input.session.user.id,
  });

  return { ok: true };
}
