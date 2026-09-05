import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { writePageChildren } from "@/server/persistence/prisma/repositories/page-children-writer";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import { lockUserMutation } from "@/server/persistence/prisma/user-mutation-lock";
import type { ProfileRepository } from "@/server/services/contracts";
import type { PersistedProfileData } from "@/types/persisted-profile";

type PageGraph = Prisma.PageGetPayload<{
  include: {
    smartLink: true;
    cards: { include: { geoDestinations: true } };
    socials: true;
    stats: true;
  };
}>;

function profileData(row: PageGraph): PersistedProfileData {
  return {
    slug: row.smartLink.slug,
    displayName: row.displayName,
    username: row.username ?? undefined,
    bio: row.bio,
    locationLabel: row.locationLabel ?? undefined,
    status: row.smartLink.status,
    appearance: structuredClone(
      row.appearance as PersistedProfileData["appearance"],
    ),
    avatarUrl: row.avatarUrl ?? undefined,
    avatarAssetId: row.avatarAssetId ?? undefined,
    coverImageUrl: row.coverImageUrl ?? undefined,
    coverAssetId: row.coverAssetId ?? undefined,
    engagement: jsonObject<PersistedProfileData["engagement"]>(row.engagement),
    stats: row.stats
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ id, value, label, visible }) => ({ id, value, label, visible })),
    socials: row.socials
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ id, name, url, visible, platform }) => ({
        id,
        name,
        url,
        visible,
        platform: (platform ?? undefined) as never,
      })),
    contentBlocks: Array.isArray(row.contentBlocks)
      ? structuredClone(
          row.contentBlocks as PersistedProfileData["contentBlocks"],
        )
      : [],
    links: row.cards
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((link) => {
        const geoDestinations = link.geoDestinations.map(
          ({ id, countryCode, countryName, url }) => ({
            id,
            countryCode,
            countryName,
            url,
          }),
        );

        return {
          id: link.id,
          title: link.title,
          description: link.description ?? undefined,
          url: link.url,
          visible: link.visible,
          platform: (link.platform ?? undefined) as never,
          layout: (link.layout ?? undefined) as never,
          aspectRatio: (link.aspectRatio ?? undefined) as never,
          imageUrl: link.imageUrl ?? undefined,
          imageAssetId: link.imageAssetId ?? undefined,
          imageAlt: link.imageAlt ?? undefined,
          imageFit: (link.imageFit ?? undefined) as never,
          imagePosition: (link.imagePosition ?? undefined) as never,
          titlePosition: (link.titlePosition ?? undefined) as never,
          showPlatformIcon: link.showPlatformIcon,
          showTitle: link.showTitle,
          showDescription: link.showDescription,
          overlayEnabled: link.overlayEnabled,
          overlayOpacity: link.overlayOpacity ?? undefined,
          customStyle: jsonObject(link.customStyle) as never,
          availability: availabilityFromJson(link.availability),
          sensitiveContent: sensitiveContentFromJson(link.sensitiveContent),
          geo: geoFromJson(link.geoConfig, geoDestinations),
          geoDestinations,
        };
      }),
  };
}

function availabilityFromJson(
  value: Prisma.JsonValue | null,
): PersistedProfileData["links"][number]["availability"] {
  const availability = recordFromJson(value);
  if (!availability) return undefined;

  return {
    visibleFrom:
      typeof availability.visibleFrom === "string"
        ? availability.visibleFrom
        : undefined,
    visibleUntil:
      typeof availability.visibleUntil === "string"
        ? availability.visibleUntil
        : undefined,
    expiryAction: availability.expiryAction === "DISABLE" ? "DISABLE" : "HIDE",
  };
}

function sensitiveContentFromJson(
  value: Prisma.JsonValue | null,
): PersistedProfileData["links"][number]["sensitiveContent"] {
  const warning = recordFromJson(value);
  if (!warning || warning.enabled !== true) return undefined;

  return {
    enabled: true,
    title: typeof warning.title === "string" ? warning.title : undefined,
    message: typeof warning.message === "string" ? warning.message : undefined,
    continueLabel:
      typeof warning.continueLabel === "string"
        ? warning.continueLabel
        : undefined,
  };
}

function geoFromJson(
  value: Prisma.JsonValue | null,
  legacyDestinations: PersistedProfileData["links"][number]["geoDestinations"],
): PersistedProfileData["links"][number]["geo"] {
  const geo = recordFromJson(value);
  if (geo && Object.keys(geo).length > 0) {
    return structuredClone(
      geo as NonNullable<PersistedProfileData["links"][number]["geo"]>,
    );
  }

  if (!legacyDestinations.length) return undefined;
  return {
    enabled: true,
    fallback: "SHOW",
    rules: legacyDestinations.map((destination) => ({
      id: destination.id,
      countryCode: destination.countryCode,
      countryName: destination.countryName,
      action: "REDIRECT",
      destination: {
        provider: "CUSTOM",
        value: destination.url,
        url: destination.url,
      },
    })),
  };
}

function jsonObject<T>(value: Prisma.JsonValue | null): T | undefined {
  const record = recordFromJson(value);
  if (!record || Object.keys(record).length === 0) return undefined;
  return structuredClone(record) as T;
}

function recordFromJson(value: Prisma.JsonValue | null) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

const pageInclude = {
  smartLink: true,
  cards: { include: { geoDestinations: true } },
  socials: true,
  stats: true,
} as const;

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findVersionedBySmartLinkIdForUser(smartLinkId: string, userId: string) {
    const row = await this.db.page.findFirst({
      where: {
        smartLinkId,
        smartLink: { userId, type: "LANDING_PAGE" },
      },
      include: pageInclude,
    });
    return row ? { profile: profileData(row), revision: row.revision } : null;
  }

  async updateForSmartLinkIfRevision(
    smartLinkId: string,
    userId: string,
    data: PersistedProfileData,
    expectedRevision: number,
  ) {
    return this.db.$transaction(async (tx) => {
      await lockUserMutation(tx, userId);

      const existingPage = await tx.page.findFirst({
        where: {
          smartLinkId,
          smartLink: { userId, type: "LANDING_PAGE" },
        },
        select: { id: true },
      });
      if (!existingPage) {
        return { ok: false as const, reason: "REVISION_CONFLICT" as const };
      }

      const updated = await tx.page.updateMany({
        where: { id: existingPage.id, revision: expectedRevision },
        data: {
          displayName: data.displayName,
          username: data.username ?? null,
          bio: data.bio,
          locationLabel: data.locationLabel ?? null,
          avatarUrl: data.avatarUrl ?? null,
          avatarAssetId: data.avatarAssetId ?? null,
          coverImageUrl: data.coverImageUrl ?? null,
          coverAssetId: data.coverAssetId ?? null,
          appearance: toJson(data.appearance),
          engagement: toJson(data.engagement ?? {}),
          contentBlocks: toJson(data.contentBlocks),
          revision: { increment: 1 },
        },
      });
      if (!updated.count) {
        return { ok: false as const, reason: "REVISION_CONFLICT" as const };
      }

      await writePageChildren(tx, existingPage.id, data);

      const saved = await tx.page.findUniqueOrThrow({
        where: { id: existingPage.id },
        include: pageInclude,
      });
      return {
        ok: true as const,
        profile: profileData(saved),
        revision: saved.revision,
      };
    });
  }
}
