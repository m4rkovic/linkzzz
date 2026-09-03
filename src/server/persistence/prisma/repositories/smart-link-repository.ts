import "server-only";

import { defaultAppearance } from "@/config/profile-defaults";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { getPageCardLimit, getSmartLinkLimit } from "@/server/business/plans";
import { PageCardDuplicateLimitError } from "@/server/business/quota-errors";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type {
  CreateSmartLinkRecord,
  SmartLinkRepository,
} from "@/server/services/contracts";
import type {
  DeeplinkConfig,
  DestinationConfig,
  GeoConfig,
  ShieldConfig,
  SmartLinkRecord,
  TrackingConfig,
} from "@/types/smart-link";

type GuardedSmartLinkRepository = Omit<
  SmartLinkRepository,
  "create" | "duplicateForUser" | "deleteIfRevision"
>;

function smartLinkRecord(row: {
  id: string;
  userId: string;
  type: SmartLinkRecord["type"];
  title: string;
  slug: string;
  status: SmartLinkRecord["status"];
  primaryDestination: unknown;
  deeplinkConfig: unknown;
  geoConfig: unknown;
  shieldConfig: unknown;
  trackingConfig: unknown;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}): SmartLinkRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    slug: row.slug,
    status: row.status,
    primaryDestination:
      (row.primaryDestination as DestinationConfig | null) ?? undefined,
    deeplink: row.deeplinkConfig as DeeplinkConfig,
    geo: row.geoConfig as GeoConfig,
    shield: row.shieldConfig as ShieldConfig,
    tracking: row.trackingConfig as TrackingConfig,
    revision: row.revision,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaSmartLinkRepository implements GuardedSmartLinkRepository {
  constructor(private readonly db: PrismaClient) {}

  async listForUser(userId: string) {
    const rows = await this.db.smartLink.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(smartLinkRecord);
  }

  async countForUser(userId: string) {
    return this.db.smartLink.count({ where: { userId } });
  }

  async findByIdForUser(id: string, userId: string) {
    const row = await this.db.smartLink.findFirst({ where: { id, userId } });
    return row ? smartLinkRecord(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.db.smartLink.findUnique({
      where: { slug: slug.trim().toLowerCase() },
    });
    return row ? smartLinkRecord(row) : null;
  }

  async createWithinLimit(
    record: Parameters<SmartLinkRepository["createWithinLimit"]>[0],
  ) {
    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, record.userId);
      const quota = await getLockedQuotaState(tx, record.userId);
      if (!quota.active) {
        return { ok: false as const, reason: "SUBSCRIPTION_INACTIVE" as const };
      }

      const currentCount = await tx.smartLink.count({ where: { userId: record.userId } });
      if (currentCount >= quota.limit) {
        return {
          ok: false as const,
          reason: "LIMIT_REACHED" as const,
          plan: quota.plan,
          limit: quota.limit,
        };
      }

      const row = await createSmartLinkInTransaction(tx, record);
      return { ok: true as const, smartLink: smartLinkRecord(row) };
    });
  }

  async updateIfRevision(
    id: string,
    userId: string,
    editable: Parameters<SmartLinkRepository["updateIfRevision"]>[2],
    expectedRevision: number,
  ) {
    const updated = await this.db.smartLink.updateMany({
      where: { id, userId, revision: expectedRevision },
      data: {
        title: editable.title,
        slug: editable.slug.trim().toLowerCase(),
        status: editable.status,
        primaryDestination: editable.primaryDestination
          ? toJson(editable.primaryDestination)
          : Prisma.JsonNull,
        deeplinkConfig: toJson(editable.deeplink),
        geoConfig: toJson(editable.geo),
        shieldConfig: toJson(editable.shield),
        trackingConfig: toJson(editable.tracking),
        revision: { increment: 1 },
      },
    });

    if (!updated.count) {
      return { ok: false as const, reason: "REVISION_CONFLICT" as const };
    }

    const row = await this.db.smartLink.findFirstOrThrow({ where: { id, userId } });
    return { ok: true as const, smartLink: smartLinkRecord(row) };
  }

  async duplicateForUserWithinLimit(
    id: string,
    userId: string,
    title: string,
    slug: string,
  ) {
    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const source = await tx.smartLink.findFirst({
        where: { id, userId },
        select: {
          status: true,
          type: true,
          page: {
            select: {
              _count: { select: { cards: true } },
            },
          },
        },
      });
      if (!source) {
        return { ok: false as const, reason: "NOT_FOUND" as const };
      }
      if (source.status === "DISABLED") {
        return { ok: false as const, reason: "SMART_LINK_DISABLED" as const };
      }

      const quota = await getLockedQuotaState(tx, userId);
      if (!quota.active) {
        return { ok: false as const, reason: "SUBSCRIPTION_INACTIVE" as const };
      }

      if (source.type === "LANDING_PAGE") {
        const currentPageCardCount = source.page?._count.cards ?? 0;
        const pageCardLimit = getPageCardLimit(quota.plan);
        if (currentPageCardCount > pageCardLimit) {
          throw new PageCardDuplicateLimitError(
            quota.plan,
            pageCardLimit,
            currentPageCardCount,
          );
        }
      }

      const currentCount = await tx.smartLink.count({ where: { userId } });
      if (currentCount >= quota.limit) {
        return {
          ok: false as const,
          reason: "LIMIT_REACHED" as const,
          plan: quota.plan,
          limit: quota.limit,
        };
      }

      const duplicate = await duplicateSmartLinkInTransaction(
        tx,
        id,
        userId,
        title,
        slug,
      );
      if (!duplicate) {
        return { ok: false as const, reason: "NOT_FOUND" as const };
      }
      return { ok: true as const, smartLink: duplicate };
    });
  }
}

async function getLockedQuotaState(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const subscription = await tx.subscription.findUnique({ where: { userId } });
  if (
    !subscription ||
    !getSubscriptionAccess(subscription.status, subscription.endsAt).hasAccess
  ) {
    return { active: false as const };
  }

  return {
    active: true as const,
    plan: subscription.plan,
    limit: getSmartLinkLimit(subscription.plan),
  };
}

async function createSmartLinkInTransaction(
  tx: Prisma.TransactionClient,
  record: CreateSmartLinkRecord,
) {
  const smartLink = await tx.smartLink.create({
    data: {
      userId: record.userId,
      type: record.type,
      title: record.title,
      slug: record.slug.trim().toLowerCase(),
      status: record.status,
      primaryDestination: record.primaryDestination
        ? toJson(record.primaryDestination)
        : undefined,
      deeplinkConfig: toJson(record.deeplink),
      geoConfig: toJson(record.geo),
      shieldConfig: toJson(record.shield),
      trackingConfig: toJson(record.tracking),
    },
  });

  if (record.type === "LANDING_PAGE") {
    await tx.page.create({
      data: {
        smartLinkId: smartLink.id,
        displayName: record.title,
        bio: "",
        appearance: toJson(defaultAppearance),
        contentBlocks: toJson([]),
      },
    });
  }

  return smartLink;
}

async function duplicateSmartLinkInTransaction(
  tx: Prisma.TransactionClient,
  id: string,
  userId: string,
  title: string,
  slug: string,
) {
  const source = await tx.smartLink.findFirst({
    where: { id, userId },
    include: {
      assets: true,
      page: {
        include: {
          cards: { include: { geoDestinations: true } },
          socials: true,
          stats: true,
        },
      },
    },
  });
  if (!source) return null;

  const duplicate = await tx.smartLink.create({
    data: {
      userId,
      type: source.type,
      title,
      slug: slug.trim().toLowerCase(),
      status: "DRAFT",
      primaryDestination: source.primaryDestination === null
        ? Prisma.JsonNull
        : toJson(source.primaryDestination),
      deeplinkConfig: toJson(source.deeplinkConfig),
      geoConfig: toJson(source.geoConfig),
      shieldConfig: toJson(source.shieldConfig),
      trackingConfig: toJson(source.trackingConfig),
    },
  });

  const assetIdMap = new Map<string, string>();
  for (const asset of source.assets) {
    const copy = await tx.asset.create({
      data: {
        smartLinkId: duplicate.id,
        type: asset.type,
        fileName: asset.fileName,
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        width: asset.width,
        height: asset.height,
      },
    });
    assetIdMap.set(asset.id, copy.id);
  }

  if (source.page) {
    const page = await tx.page.create({
      data: {
        smartLinkId: duplicate.id,
        displayName: source.page.displayName,
        username: source.page.username,
        bio: source.page.bio,
        locationLabel: source.page.locationLabel,
        avatarAssetId: source.page.avatarAssetId
          ? assetIdMap.get(source.page.avatarAssetId) ?? null
          : null,
        coverAssetId: source.page.coverAssetId
          ? assetIdMap.get(source.page.coverAssetId) ?? null
          : null,
        appearance: toJson(source.page.appearance),
        contentBlocks: toJson(remapBlockAssets(source.page.contentBlocks, assetIdMap)),
      },
    });

    const cardIdMap = new Map<string, string>();
    for (const card of source.page.cards) {
      const cardCopy = await tx.pageCard.create({
        data: {
          pageId: page.id,
          title: card.title,
          description: card.description,
          url: card.url,
          visible: card.visible,
          sortOrder: card.sortOrder,
          platform: card.platform,
          layout: card.layout,
          aspectRatio: card.aspectRatio,
          imageFit: card.imageFit,
          imagePosition: card.imagePosition,
          titlePosition: card.titlePosition,
          showPlatformIcon: card.showPlatformIcon,
          showTitle: card.showTitle,
          showDescription: card.showDescription,
          overlayEnabled: card.overlayEnabled,
          overlayOpacity: card.overlayOpacity,
          customStyle: card.customStyle === null
            ? Prisma.JsonNull
            : toJson(card.customStyle),
          imageAssetId: card.imageAssetId
            ? assetIdMap.get(card.imageAssetId) ?? null
            : null,
        },
      });
      cardIdMap.set(card.id, cardCopy.id);
      if (card.geoDestinations.length) {
        await tx.pageCardGeoDestination.createMany({
          data: card.geoDestinations.map((geo) => ({
            pageCardId: cardCopy.id,
            countryCode: geo.countryCode,
            countryName: geo.countryName,
            url: geo.url,
          })),
        });
      }
    }

    await tx.page.update({
      where: { id: page.id },
      data: {
        appearance: toJson(remapPageEngagement(source.page.appearance, cardIdMap)),
      },
    });

    if (source.page.socials.length) {
      await tx.socialLink.createMany({
        data: source.page.socials.map((social) => ({
          pageId: page.id,
          name: social.name,
          url: social.url,
          visible: social.visible,
          platform: social.platform,
          sortOrder: social.sortOrder,
        })),
      });
    }

    if (source.page.stats.length) {
      await tx.pageStat.createMany({
        data: source.page.stats.map((stat) => ({
          pageId: page.id,
          value: stat.value,
          label: stat.label,
          visible: stat.visible,
          sortOrder: stat.sortOrder,
        })),
      });
    }
  }

  const created = await tx.smartLink.findUniqueOrThrow({
    where: { id: duplicate.id },
  });
  return smartLinkRecord(created);
}

function remapPageEngagement(value: unknown, cardIdMap: Map<string, string>) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const appearance = structuredClone(value) as Record<string, unknown>;
  const rawEngagement = appearance.__engagement;
  if (!rawEngagement || typeof rawEngagement !== "object" || Array.isArray(rawEngagement)) return appearance;

  const engagement = { ...(rawEngagement as Record<string, unknown>) };
  const featuredLinkId = typeof engagement.featuredLinkId === "string"
    ? cardIdMap.get(engagement.featuredLinkId)
    : undefined;
  if (featuredLinkId) engagement.featuredLinkId = featuredLinkId;
  else delete engagement.featuredLinkId;

  const rawCampaign = engagement.campaign;
  if (rawCampaign && typeof rawCampaign === "object" && !Array.isArray(rawCampaign)) {
    const campaign = { ...(rawCampaign as Record<string, unknown>) };
    const primaryLinkId = typeof campaign.primaryLinkId === "string"
      ? cardIdMap.get(campaign.primaryLinkId)
      : undefined;
    if (primaryLinkId) campaign.primaryLinkId = primaryLinkId;
    else {
      delete campaign.primaryLinkId;
      campaign.enabled = false;
    }
    engagement.campaign = campaign;
  }

  appearance.__engagement = engagement;
  return appearance;
}

function remapBlockAssets(value: unknown, assetIdMap: Map<string, string>) {
  if (!Array.isArray(value)) return [];
  return structuredClone(value).map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
    const block = raw as Record<string, unknown>;
    if (block.type !== "GALLERY" || !Array.isArray(block.images)) return block;
    return {
      ...block,
      images: block.images.map((rawImage) => {
        if (!rawImage || typeof rawImage !== "object" || Array.isArray(rawImage)) return rawImage;
        const image = { ...(rawImage as Record<string, unknown>) };
        const assetId = typeof image.imageAssetId === "string" ? image.imageAssetId : undefined;
        const mappedAssetId = assetId ? assetIdMap.get(assetId) : undefined;
        if (mappedAssetId) image.imageAssetId = mappedAssetId;
        else delete image.imageAssetId;
        return image;
      }),
    };
  });
}
