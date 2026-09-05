import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { canStoreAssetBytes, AssetStorageQuotaError } from "@/server/business/asset-quota";
import { collectAssetIdsFromJson } from "@/server/assets/asset-references";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type { AssetRecord, AssetRepository } from "@/server/services/contracts";

export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.asset.findUnique({ where: { id } });
  }

  async findByIdsForSmartLink(userId: string, smartLinkId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.db.asset.findMany({
      where: { id: { in: ids }, smartLinkId, smartLink: { userId } },
    });
  }

  async createForSmartLink(
    userId: string,
    smartLinkId: string,
    asset: Omit<AssetRecord, "smartLinkId">,
  ) {
    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const owned = await tx.smartLink.findFirst({
        where: { id: smartLinkId, userId, type: "LANDING_PAGE" },
        select: { id: true },
      });
      if (!owned) throw new Error("Landing Page SmartLink not found.");

      const existingAssets = await tx.asset.findMany({
        where: { smartLink: { userId } },
        select: { storageKey: true, sizeBytes: true },
      });
      const usedBytes = [...new Map(
        existingAssets.map((existing) => [existing.storageKey, existing.sizeBytes]),
      ).values()].reduce((total, sizeBytes) => total + sizeBytes, 0);
      const decision = canStoreAssetBytes(usedBytes, asset.sizeBytes);
      if (!decision.allowed) {
        throw new AssetStorageQuotaError(
          decision.limitBytes,
          decision.usedBytes,
          decision.requestedBytes,
        );
      }

      return tx.asset.create({ data: { ...asset, smartLinkId } });
    });
  }

  async delete(id: string) {
    await this.db.asset.deleteMany({ where: { id } });
  }

  async deleteUnusedForSmartLink(userId: string, smartLinkId: string, ids: string[]) {
    const page = await this.db.page.findFirst({
      where: { smartLinkId, smartLink: { userId } },
      select: { contentBlocks: true },
    });
    const protectedIds = collectAssetIdsFromJson(page?.contentBlocks);
    return this.deleteUnused(
      { smartLinkId, smartLink: { userId } },
      ids.filter((id) => !protectedIds.has(id)),
    );
  }

  async deleteOrphaned(limit = 200) {
    const batchSize = Number.isSafeInteger(limit) && limit > 0
      ? Math.min(limit, 1_000)
      : 200;

    return this.db.$transaction(async (tx) => {
      const candidateWhere = {
        avatarFor: { none: {} },
        coverFor: { none: {} },
        imageFor: { none: {} },
      } as const;
      const initialCandidates = await tx.asset.findMany({
        where: candidateWhere,
        orderBy: { createdAt: "asc" },
        take: batchSize,
        include: { smartLink: { select: { userId: true } } },
      });
      if (!initialCandidates.length) return [];

      const userIds = [...new Set(initialCandidates.map((asset) => asset.smartLink.userId))].sort();
      for (const userId of userIds) await lockUserMutation(tx, userId);

      const candidates = await tx.asset.findMany({
        where: {
          ...candidateWhere,
          smartLink: { userId: { in: userIds } },
        },
        orderBy: { createdAt: "asc" },
        take: batchSize,
        include: { smartLink: { select: { userId: true } } },
      });
      const smartLinkIds = [...new Set(candidates.map((asset) => asset.smartLinkId))];
      const pages = await tx.page.findMany({
        where: { smartLinkId: { in: smartLinkIds } },
        select: {
          smartLinkId: true,
          avatarAssetId: true,
          coverAssetId: true,
          contentBlocks: true,
        },
      });
      const referencedIds = new Set<string>();
      for (const page of pages) {
        if (page.avatarAssetId) referencedIds.add(page.avatarAssetId);
        if (page.coverAssetId) referencedIds.add(page.coverAssetId);
        for (const id of collectAssetIdsFromJson(page.contentBlocks)) referencedIds.add(id);
      }

      const orphanIds = candidates
        .filter((asset) => !referencedIds.has(asset.id))
        .map((asset) => asset.id);
      if (!orphanIds.length) return [];

      const unused = await tx.asset.findMany({
        where: { id: { in: orphanIds }, ...candidateWhere },
      });
      if (!unused.length) return [];

      await tx.asset.deleteMany({ where: { id: { in: unused.map((asset) => asset.id) } } });

      const storageKeys = [...new Set(unused.map((asset) => asset.storageKey))];
      const retained = await tx.asset.findMany({
        where: { storageKey: { in: storageKeys } },
        select: { storageKey: true },
      });
      const retainedKeys = new Set(retained.map((asset) => asset.storageKey));
      return unused.filter((asset) => !retainedKeys.has(asset.storageKey));
    });
  }

  private async deleteUnused(
    ownership: Prisma.AssetWhereInput,
    ids: string[],
  ) {
    if (!ids.length) return [];
    return this.db.$transaction(async (tx) => {
      const unused = await tx.asset.findMany({
        where: {
          id: { in: ids },
          ...ownership,
          avatarFor: { none: {} },
          coverFor: { none: {} },
          imageFor: { none: {} },
        },
      });
      if (!unused.length) return [];

      await tx.asset.deleteMany({
        where: { id: { in: unused.map((asset) => asset.id) }, ...ownership },
      });

      const storageKeys = [...new Set(unused.map((asset) => asset.storageKey))];
      const stillReferenced = await tx.asset.findMany({
        where: { storageKey: { in: storageKeys } },
        select: { storageKey: true },
      });
      const retained = new Set(stillReferenced.map((asset) => asset.storageKey));
      return unused.filter((asset) => !retained.has(asset.storageKey));
    });
  }
}
