import "server-only";

import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { getAssetStorage } from "@/server/assets/storage-factory";
import { getSmartLinkDeletionRepository } from "@/server/persistence/dependencies";

export type DeleteSmartLinkServiceResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "SMART_LINK_CONFLICT"
        | "SMART_LINK_NOT_DRAFT"
        | "SMART_LINK_DISABLED"
        | "LAST_LANDING_PAGE";
      message: string;
    };

export async function deleteOwnSmartLink(
  session: AuthenticatedSession,
  id: string,
  expectedRevision: number,
): Promise<DeleteSmartLinkServiceResult> {
  if (session.user.role !== "CUSTOMER") {
    return { ok: false, code: "NOT_FOUND", message: "Link not found." };
  }

  const repository = getSmartLinkDeletionRepository();
  const deleted = await repository.deleteOwn(
    session.user.id,
    id,
    expectedRevision,
  );

  if (!deleted.ok) {
    switch (deleted.reason) {
      case "NOT_FOUND":
        return { ok: false, code: "NOT_FOUND", message: "Link not found." };
      case "REVISION_CONFLICT":
        return {
          ok: false,
          code: "SMART_LINK_CONFLICT",
          message: "This Smart Link changed in another tab. Reload before deleting it.",
        };
      case "SMART_LINK_DISABLED":
        return {
          ok: false,
          code: "SMART_LINK_DISABLED",
          message: "Administrator-disabled links cannot be deleted by the customer.",
        };
      case "SMART_LINK_NOT_DRAFT":
        return {
          ok: false,
          code: "SMART_LINK_NOT_DRAFT",
          message: "Move this Smart Link to Draft before deleting it.",
        };
      case "LAST_LANDING_PAGE":
        return {
          ok: false,
          code: "LAST_LANDING_PAGE",
          message: "Your account must keep at least one Landing Page.",
        };
    }
  }

  if (deleted.storageKeysToRemove.length) {
    try {
      const storage = await getAssetStorage();
      await Promise.allSettled(
        deleted.storageKeysToRemove.map((storageKey) => storage.remove(storageKey)),
      );
    } catch {
      // Database deletion is authoritative. A storage sweep may retry orphan cleanup later.
    }
  }

  return { ok: true };
}
