import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { AssetRecord, AssetRepository } from "@/server/services/contracts";

function collectPageBlockAssetIds(values: unknown[]) {
  const ids = new Set<string>();
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    for (const rawBlock of value) {
      if (!rawBlock || typeof rawBlock !== "object" || Array.isArray(rawBlock)) continue;
      const block = rawBlock as Record<string, unknown>;
      if (block.type !== "GALLERY" || !Array.isArray(block.images)) continue;
      for (const rawImage of block.images) {
        if (!rawImage || typeof rawImage !== "object" || Array.isArray(rawImage)) continue;
        const assetId = (rawImage as Record<string, unknown>).imageAssetId;
        if (typeof assetId === "string") ids.add(assetId);
      }
    }
  }
  return ids;
}

export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string) {
    return this.db.asset.findUnique({ where: { id } });
  }

  async findByIdsForUser(userId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.db.asset.findMany({
      where: { id: { in: ids }, smartLink: { userId } },
    });
  }

  async findByIdsForSmartLink(userId: string, smartLinkId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.db.asset.findMany({
      where: { id: { in: ids }, smartLinkId, smartLink: { userId } },
    });
  }

  async create(asset: AssetRecord) {
    return this.db.asset.create({ data: asset });
  }

  async createForUser(userId: string, asset: Omit<AssetRecord, "smartLinkId">) {
    const smartLink = await this.db.smartLink.findFirst({
      where: { userId, type: "LANDING_PAGE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!smartLink) throw new Error("Landing Page SmartLink not found.");
    return this.create({ ...asset, smartLinkId: smartLink.id });
  }

  async createForSmartLink(
    userId: string,
    smartLinkId: string,
    asset: Omit<AssetRecord, "smartLinkId">,
  ) {
    const owned = await this.db.smartLink.findFirst({
      where: { id: smartLinkId, userId, type: "LANDING_PAGE" },
      select: { id: true },
    });
    if (!owned) throw new Error("Landing Page SmartLink not found.");
    return this.create({ ...asset, smartLinkId });
  }

  async delete(id: string) {
    await this.db.asset.deleteMany({ where: { id } });
  }

  async deleteUnusedForUser(userId: string, ids: string[]) {
    const pages = await this.db.page.findMany({
      where: { smartLink: { userId } },
      select: { contentBlocks: true },
    });
    const protectedIds = collectPageBlockAssetIds(pages.map((page) => page.contentBlocks));
    return this.deleteUnused(
      { smartLink: { userId } },
      ids.filter((id) => !protectedIds.has(id)),
    );
  }

  async deleteUnusedForSmartLink(userId: string, smartLinkId: string, ids: string[]) {
    const page = await this.db.page.findFirst({
      where: { smartLinkId, smartLink: { userId } },
      select: { contentBlocks: true },
    });
    const protectedIds = collectPageBlockAssetIds(page ? [page.contentBlocks] : []);
    return this.deleteUnused(
      { smartLinkId, smartLink: { userId } },
      ids.filter((id) => !protectedIds.has(id)),
    );
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

