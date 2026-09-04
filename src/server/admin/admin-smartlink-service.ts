import "server-only";

import { AdminError } from "@/server/admin/admin-errors";
import { getAdminUser } from "@/server/admin/admin-service";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { SmartLinkModerationMutation } from "@/server/smart-links/smart-link-lifecycle";
import type { AdminUserAction } from "@/types/admin-api";

export function isAdminSmartLinkAction(
  action: AdminUserAction,
): action is SmartLinkModerationMutation {
  return action.type === "SET_SMART_LINK_STATUS";
}

export async function performAdminSmartLinkAction(
  admin: AuthenticatedSession,
  userId: string,
  action: SmartLinkModerationMutation,
) {
  const dependencies = await getServerDependencies();
  await dependencies.adminSmartLinks.apply(admin.user.id, userId, action);

  const result = await getAdminUser(userId);
  if (!result) {
    throw new AdminError("CUSTOMER_NOT_FOUND", "Customer not found.");
  }
  return result;
}
