import "server-only";

import { randomInt } from "node:crypto";

import { getAdminUser } from "@/server/admin/admin-service";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { passwordHasher } from "@/server/auth/password-hasher";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AdminAccountMutation } from "@/server/services/contracts";
import type { AdminUserAction } from "@/types/admin-api";

type AdminAccountAction = Extract<
  AdminUserAction,
  { type: "SUSPEND" | "REACTIVATE" | "RESET_PASSWORD" }
>;

export function isAdminAccountAction(
  action: AdminUserAction,
): action is AdminAccountAction {
  return action.type === "SUSPEND" ||
    action.type === "REACTIVATE" ||
    action.type === "RESET_PASSWORD";
}

export async function performAdminAccountAction(
  admin: AuthenticatedSession,
  userId: string,
  action: AdminAccountAction,
) {
  const dependencies = await getServerDependencies();
  let mutation: AdminAccountMutation;
  let temporaryPassword: string | undefined;

  if (action.type === "RESET_PASSWORD") {
    temporaryPassword = generateTemporaryPassword();
    mutation = {
      type: "RESET_PASSWORD",
      passwordHash: await passwordHasher.hash(temporaryPassword),
    };
  } else if (action.type === "SUSPEND") {
    mutation = { type: "SUSPEND", reason: action.reason };
  } else {
    mutation = { type: "REACTIVATE" };
  }

  await dependencies.adminAccounts.apply(admin.user.id, userId, mutation);

  const result = await getAdminUser(userId);
  if (!result) throw new Error("Customer not found.");
  return temporaryPassword ? { ...result, temporaryPassword } : result;
}

function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 16) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function pick(characters: string) {
  return characters[randomInt(characters.length)]!;
}
