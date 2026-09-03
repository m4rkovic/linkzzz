import "server-only";

import { AdminError } from "@/server/admin/admin-errors";
import { getAdminUser } from "@/server/admin/admin-service";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AdminUserAction } from "@/types/admin-api";

type AdminSmartLinkAction = Extract<
  AdminUserAction,
  { type: "SET_SMART_LINK_STATUS" }
>;

export function isAdminSmartLinkAction(
  action: AdminUserAction,
): action is AdminSmartLinkAction {
  return action.type === "SET_SMART_LINK_STATUS";
}

export async function performAdminSmartLinkAction(
  admin: AuthenticatedSession,
  userId: string,
  action: AdminSmartLinkAction,
) {
  const dependencies = await getServerDependencies();
  await dependencies.adminSmartLinks.apply(admin.user.id, userId, {
    smartLinkId: action.smartLinkId,
    status: action.status,
  });

  const result = await getAdminUser(userId);
  if (!result) {
    throw new AdminError("CUSTOMER_NOT_FOUND", "Customer not found.");
  }
  return result;
}
