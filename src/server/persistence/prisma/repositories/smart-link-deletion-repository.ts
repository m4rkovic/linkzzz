import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";

export type DeleteOwnSmartLinkRepositoryResult =
  | { ok: true; storageKeysToRemove: string[] }
  | {
      ok: false;
      reason:
        | "NOT_FOUND"
        | "REVISION_CONFLICT"
        | "SMART_LINK_NOT_DRAFT"
        | "SMART_LINK_DISABLED"
        | "LAST_LANDING_PAGE";
    };

export class PrismaSmartLinkDeletionRepository {
  constructor(private readonly db: PrismaClient) {}

  async deleteOwn(
    userId: string,
    smartLinkId: string,
    expectedRevision: number,
  ): Promise<DeleteOwnSmartLinkRepositoryResult> {
    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const source = await tx.smartLink.findFirst({
        where: { id: smartLinkId, userId },
        select: {
          id: true,
          type: true,
          title: true,
          slug: true,
          status: true,
          revision: true,
          assets: { select: { storageKey: true } },
        },
      });
      if (!source) {
        return { ok: false, reason: "NOT_FOUND" };
      }

      if (source.status === "DISABLED") {
        return { ok: false, reason: "SMART_LINK_DISABLED" };
      }
      if (source.status !== "DRAFT") {
        return { ok: false, reason: "SMART_LINK_NOT_DRAFT" };
      }
      if (source.revision !== expectedRevision) {
        return { ok: false, reason: "REVISION_CONFLICT" };
      }

      if (source.type === "LANDING_PAGE") {
        const landingPageCount = await tx.smartLink.count({
          where: { userId, type: "LANDING_PAGE" },
        });
        if (landingPageCount <= 1) {
          return { ok: false, reason: "LAST_LANDING_PAGE" };
        }
      }

      const deleted = await tx.smartLink.deleteMany({
        where: { id: source.id, userId, revision: expectedRevision },
      });
      if (deleted.count !== 1) {
        return { ok: false, reason: "REVISION_CONFLICT" };
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          targetUserId: userId,
          action: "SMART_LINK_DELETED",
          resourceType: "SMART_LINK",
          resourceId: source.id,
          metadata: toJson({
            title: source.title,
            slug: source.slug,
            type: source.type,
          }),
        },
      });

      const storageKeys = [...new Set(source.assets.map((asset) => asset.storageKey))];
      if (!storageKeys.length) {
        return { ok: true, storageKeysToRemove: [] };
      }

      const stillReferenced = await tx.asset.findMany({
        where: { storageKey: { in: storageKeys } },
        select: { storageKey: true },
      });
      const retained = new Set(stillReferenced.map((asset) => asset.storageKey));

      return {
        ok: true,
        storageKeysToRemove: storageKeys.filter((storageKey) => !retained.has(storageKey)),
      };
    });
  }
}
