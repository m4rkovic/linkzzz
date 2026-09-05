import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import {
  canStoreAssetBytes,
  AssetStorageQuotaError,
} from "@/server/business/asset-quota";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type {
  AssetRecord,
  AssetRepository,
} from "@/server/services/contracts";

export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.asset.findUnique({ where: { id } });
  }

  async findByIdsForSmartLink(
    userId: string,
    smartLinkId: string,
    ids: string[],
  ) {
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
      const usedBytes = [
        ...new Map(
          existingAssets.map((existing) => [
            existing.storageKey,
            existing.sizeBytes,
          ]),
        ).values(),
      ].reduce((total, sizeBytes) => total + sizeBytes, 0);
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
    await this.db.asset.deleteMany({
      where: {
        id,
        avatarFor: { none: {} },
        coverFor: { none: {} },
        imageFor: { none: {} },
        contentFor: { none: {} },
      },
    });
  }

  async deleteUnusedForSmartLink(
    userId: string,
    smartLinkId: string,
    ids: string[],
  ) {
    if (!ids.length) return [];

    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);
      return deleteUnusedInTransaction(
        tx,
        { smartLinkId, smartLink: { userId } },
        ids,
      );
    });
  }

  async deleteOrphaned(limit = 200) {
    const batchSize =
      Number.isSafeInteger(limit) && limit > 0 ? Math.min(limit, 1_000) : 200;

    return this.db.$transaction(async (tx) => {
      const candidateWhere = unusedAssetWhere();
      const initialCandidates = await tx.asset.findMany({
        where: candidateWhere,
        orderBy: { createdAt: "asc" },
        take: batchSize,
        include: { smartLink: { select: { userId: true } } },
      });
      if (!initialCandidates.length) return [];

      const userIds = [
        ...new Set(initialCandidates.map((asset) => asset.smartLink.userId)),
      ].sort();
      for (const userId of userIds) {
        await lockUserMutation(tx, userId);
      }

      const candidates = await tx.asset.findMany({
        where: {
          ...candidateWhere,
          smartLink: { userId: { in: userIds } },
        },
        orderBy: { createdAt: "asc" },
        take: batchSize,
      });
      if (!candidates.length) return [];

      await tx.asset.deleteMany({
        where: {
          id: { in: candidates.map((asset) => asset.id) },
          ...candidateWhere,
        },
      });

      const storageKeys = [
        ...new Set(candidates.map((asset) => asset.storageKey)),
      ];
      const retained = await tx.asset.findMany({
        where: { storageKey: { in: storageKeys } },
        select: { storageKey: true },
      });
      const retainedKeys = new Set(
        retained.map((asset) => asset.storageKey),
      );
      return candidates.filter(
        (asset) => !retainedKeys.has(asset.storageKey),
      );
    });
  }
}

function unusedAssetWhere() {
  return {
    avatarFor: { none: {} },
    coverFor: { none: {} },
    imageFor: { none: {} },
    contentFor: { none: {} },
  } as const;
}

async function deleteUnusedInTransaction(
  tx: Prisma.TransactionClient,
  ownership: Prisma.AssetWhereInput,
  ids: string[],
) {
  if (!ids.length) return [];

  const unused = await tx.asset.findMany({
    where: {
      id: { in: ids },
      ...ownership,
      ...unusedAssetWhere(),
    },
  });
  if (!unused.length) return [];

  await tx.asset.deleteMany({
    where: {
      id: { in: unused.map((asset) => asset.id) },
      ...ownership,
      ...unusedAssetWhere(),
    },
  });

  const storageKeys = [...new Set(unused.map((asset) => asset.storageKey))];
  const stillReferenced = await tx.asset.findMany({
    where: { storageKey: { in: storageKeys } },
    select: { storageKey: true },
  });
  const retained = new Set(
    stillReferenced.map((asset) => asset.storageKey),
  );
  return unused.filter((asset) => !retained.has(asset.storageKey));
}
