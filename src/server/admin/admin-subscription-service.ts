import "server-only";

import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getAdminUser } from "@/server/admin/admin-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AdminSubscriptionMutation } from "@/server/services/contracts";
import type { AdminUserAction } from "@/types/admin-api";

export function isAdminSubscriptionAction(
  action: AdminUserAction,
): action is AdminSubscriptionMutation {
  switch (action.type) {
    case "RENEW":
    case "STOP_RENEWAL":
    case "RESUME_RENEWAL":
    case "STOP_IMMEDIATELY":
    case "CHANGE_PLAN":
      return true;
    default:
      return false;
  }
}

export async function performAdminSubscriptionAction(
  admin: AuthenticatedSession,
  userId: string,
  action: AdminSubscriptionMutation,
) {
  const dependencies = await getServerDependencies();
  await dependencies.adminSubscriptions.apply(admin.user.id, userId, action);

  const result = await getAdminUser(userId);
  if (!result) throw new Error("Customer not found.");
  return result;
}
