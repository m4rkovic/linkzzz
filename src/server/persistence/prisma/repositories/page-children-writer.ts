import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { linkGeoToLegacyDestinations } from "@/features/links/link-geo";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import type { PersistedProfileData } from "@/types/persisted-profile";

type PageCardWrite = {
  id: string;
  pageId: string;
  title: string;
  description: string | null;
  url: string;
  visible: boolean;
  sortOrder: number;
  platform: string | null;
  layout: string | null;
  aspectRatio: string | null;
  imageFit: string | null;
  imagePosition: string | null;
  titlePosition: string | null;
  showPlatformIcon: boolean;
  showTitle: boolean;
  showDescription: boolean;
  overlayEnabled: boolean;
  overlayOpacity: number | null;
  imageAssetId: string | null;
  customStyle: Prisma.InputJsonValue;
};

type SocialLinkWrite = {
  id: string;
  pageId: string;
  name: string;
  url: string;
  visible: boolean;
  platform: string | null;
  sortOrder: number;
};

type PageStatWrite = {
  id: string;
  pageId: string;
  value: string;
  label: string;
  visible: boolean;
  sortOrder: number;
};

export async function writePageChildren(
  tx: Prisma.TransactionClient,
  pageId: string,
  data: PersistedProfileData,
) {
  const existingCards = await tx.pageCard.findMany({
    where: { pageId },
    select: { id: true },
  });
  const ownedCardIds = new Set(existingCards.map((card) => card.id));
  const retainedCardIds = data.links
    .map((link) => link.id)
    .filter((id) => ownedCardIds.has(id));

  await tx.pageCard.deleteMany({
    where: {
      pageId,
      ...(retainedCardIds.length ? { id: { notIn: retainedCardIds } } : {}),
    },
  });

  const cardIdMap = new Map<string, string>();
  const cardWrites = data.links.map((link, sortOrder) => {
    const owned = ownedCardIds.has(link.id);
    const id = owned ? link.id : randomUUID();
    cardIdMap.set(link.id, id);

    return {
      owned,
      data: {
        id,
        pageId,
        title: link.title,
        description: link.description ?? null,
        url: link.url,
        visible: link.visible,
        sortOrder,
        platform: link.platform ?? null,
        layout: link.layout ?? null,
        aspectRatio: link.aspectRatio ?? null,
        imageFit: link.imageFit ?? null,
        imagePosition: link.imagePosition ?? null,
        titlePosition: link.titlePosition ?? null,
        showPlatformIcon: link.showPlatformIcon ?? true,
        showTitle: link.showTitle ?? true,
        showDescription: link.showDescription ?? true,
        overlayEnabled: link.overlayEnabled ?? false,
        overlayOpacity: link.overlayOpacity ?? null,
        imageAssetId: link.imageAssetId ?? null,
        customStyle: toJson({
          value: link.customStyle ?? null,
          __imageUrl: link.imageUrl ?? null,
          __imageAlt: link.imageAlt ?? null,
          __availability: link.availability ?? null,
          __sensitiveContent: link.sensitiveContent ?? null,
          __geo: link.geo ?? null,
        }),
      } satisfies PageCardWrite,
    };
  });

  const existingCardWrites = cardWrites
    .filter((write) => write.owned)
    .map((write) => write.data);
  const newCardWrites = cardWrites
    .filter((write) => !write.owned)
    .map((write) => write.data);

  if (existingCardWrites.length) {
    const updatedCardIds = await updatePageCards(tx, pageId, existingCardWrites);
    if (updatedCardIds.length !== existingCardWrites.length) {
      throw new Error("Page card ownership changed while the page was being saved.");
    }
  }
  if (newCardWrites.length) {
    await tx.pageCard.createMany({ data: newCardWrites });
  }

  const persistedCardIds = cardWrites.map((write) => write.data.id);
  if (persistedCardIds.length) {
    await tx.pageCardGeoDestination.deleteMany({
      where: {
        pageCardId: { in: persistedCardIds },
        pageCard: { pageId },
      },
    });
  }

  const geoDestinationWrites = data.links.flatMap((link) => {
    const pageCardId = cardIdMap.get(link.id);
    if (!pageCardId) return [];

    return linkGeoToLegacyDestinations(link.geo, link.geoDestinations).map(
      (destination) => ({
        pageCardId,
        countryCode: destination.countryCode,
        countryName: destination.countryName,
        url: destination.url,
      }),
    );
  });
  if (geoDestinationWrites.length) {
    await tx.pageCardGeoDestination.createMany({ data: geoDestinationWrites });
  }

  await remapPageEngagement(tx, pageId, data.engagement, cardIdMap);
  await writeSocialLinks(tx, pageId, data);
  await writePageStats(tx, pageId, data);
}

async function writeSocialLinks(
  tx: Prisma.TransactionClient,
  pageId: string,
  data: PersistedProfileData,
) {
  const existing = await tx.socialLink.findMany({
    where: { pageId },
    select: { id: true },
  });
  const ownedIds = new Set(existing.map((social) => social.id));
  const retainedIds = data.socials
    .map((social) => social.id)
    .filter((id) => ownedIds.has(id));

  await tx.socialLink.deleteMany({
    where: {
      pageId,
      ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}),
    },
  });

  const writes = data.socials.map((social, sortOrder) => {
    const owned = ownedIds.has(social.id);
    return {
      owned,
      data: {
        id: owned ? social.id : randomUUID(),
        pageId,
        name: social.name,
        url: social.url,
        visible: social.visible,
        platform: social.platform ?? null,
        sortOrder,
      } satisfies SocialLinkWrite,
    };
  });
  const existingWrites = writes.filter((write) => write.owned).map((write) => write.data);
  const newWrites = writes.filter((write) => !write.owned).map((write) => write.data);

  if (existingWrites.length) {
    const updatedIds = await updateSocialLinks(tx, pageId, existingWrites);
    if (updatedIds.length !== existingWrites.length) {
      throw new Error("Social link ownership changed while the page was being saved.");
    }
  }
  if (newWrites.length) {
    await tx.socialLink.createMany({ data: newWrites });
  }
}

async function writePageStats(
  tx: Prisma.TransactionClient,
  pageId: string,
  data: PersistedProfileData,
) {
  const stats = data.stats ?? [];
  const existing = await tx.pageStat.findMany({
    where: { pageId },
    select: { id: true },
  });
  const ownedIds = new Set(existing.map((stat) => stat.id));
  const retainedIds = stats
    .map((stat) => stat.id)
    .filter((id) => ownedIds.has(id));

  await tx.pageStat.deleteMany({
    where: {
      pageId,
      ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}),
    },
  });

  const writes = stats.map((stat, sortOrder) => {
    const owned = ownedIds.has(stat.id);
    return {
      owned,
      data: {
        id: owned ? stat.id : randomUUID(),
        pageId,
        value: stat.value,
        label: stat.label,
        visible: stat.visible,
        sortOrder,
      } satisfies PageStatWrite,
    };
  });
  const existingWrites = writes.filter((write) => write.owned).map((write) => write.data);
  const newWrites = writes.filter((write) => !write.owned).map((write) => write.data);

  if (existingWrites.length) {
    const updatedIds = await updatePageStats(tx, pageId, existingWrites);
    if (updatedIds.length !== existingWrites.length) {
      throw new Error("Page stat ownership changed while the page was being saved.");
    }
  }
  if (newWrites.length) {
    await tx.pageStat.createMany({ data: newWrites });
  }
}

async function updatePageCards(
  tx: Prisma.TransactionClient,
  pageId: string,
  rows: PageCardWrite[],
) {
  return tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE "PageCard" AS card
    SET
      "title" = incoming."title",
      "description" = incoming."description",
      "url" = incoming."url",
      "visible" = incoming."visible",
      "sortOrder" = incoming."sortOrder",
      "platform" = incoming."platform",
      "layout" = incoming."layout",
      "aspectRatio" = incoming."aspectRatio",
      "imageFit" = incoming."imageFit",
      "imagePosition" = incoming."imagePosition",
      "titlePosition" = incoming."titlePosition",
      "showPlatformIcon" = incoming."showPlatformIcon",
      "showTitle" = incoming."showTitle",
      "showDescription" = incoming."showDescription",
      "overlayEnabled" = incoming."overlayEnabled",
      "overlayOpacity" = incoming."overlayOpacity",
      "imageAssetId" = incoming."imageAssetId",
      "customStyle" = incoming."customStyle",
      "updatedAt" = CURRENT_TIMESTAMP
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS incoming(
      "id" text,
      "pageId" text,
      "title" text,
      "description" text,
      "url" text,
      "visible" boolean,
      "sortOrder" integer,
      "platform" text,
      "layout" text,
      "aspectRatio" text,
      "imageFit" text,
      "imagePosition" text,
      "titlePosition" text,
      "showPlatformIcon" boolean,
      "showTitle" boolean,
      "showDescription" boolean,
      "overlayEnabled" boolean,
      "overlayOpacity" double precision,
      "imageAssetId" text,
      "customStyle" jsonb
    )
    WHERE card."id" = incoming."id"
      AND card."pageId" = ${pageId}
      AND incoming."pageId" = ${pageId}
    RETURNING card."id"
  `);
}

async function updateSocialLinks(
  tx: Prisma.TransactionClient,
  pageId: string,
  rows: SocialLinkWrite[],
) {
  return tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE "SocialLink" AS social
    SET
      "name" = incoming."name",
      "url" = incoming."url",
      "visible" = incoming."visible",
      "platform" = incoming."platform",
      "sortOrder" = incoming."sortOrder",
      "updatedAt" = CURRENT_TIMESTAMP
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS incoming(
      "id" text,
      "pageId" text,
      "name" text,
      "url" text,
      "visible" boolean,
      "platform" text,
      "sortOrder" integer
    )
    WHERE social."id" = incoming."id"
      AND social."pageId" = ${pageId}
      AND incoming."pageId" = ${pageId}
    RETURNING social."id"
  `);
}

async function updatePageStats(
  tx: Prisma.TransactionClient,
  pageId: string,
  rows: PageStatWrite[],
) {
  return tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    UPDATE "PageStat" AS stat
    SET
      "value" = incoming."value",
      "label" = incoming."label",
      "visible" = incoming."visible",
      "sortOrder" = incoming."sortOrder",
      "updatedAt" = CURRENT_TIMESTAMP
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS incoming(
      "id" text,
      "pageId" text,
      "value" text,
      "label" text,
      "visible" boolean,
      "sortOrder" integer
    )
    WHERE stat."id" = incoming."id"
      AND stat."pageId" = ${pageId}
      AND incoming."pageId" = ${pageId}
    RETURNING stat."id"
  `);
}

async function remapPageEngagement(
  tx: Prisma.TransactionClient,
  pageId: string,
  engagement: PersistedProfileData["engagement"],
  cardIdMap: Map<string, string>,
) {
  const page = await tx.page.findUnique({
    where: { id: pageId },
    select: { appearance: true },
  });
  if (!page) throw new Error("Landing page disappeared while it was being saved.");

  const appearance =
    page.appearance &&
    typeof page.appearance === "object" &&
    !Array.isArray(page.appearance)
      ? { ...(page.appearance as Record<string, unknown>) }
      : {};

  appearance.__engagement = engagement
    ? remapEngagementCardIds(engagement, cardIdMap)
    : null;

  await tx.page.update({
    where: { id: pageId },
    data: { appearance: toJson(appearance) },
  });
}

function remapEngagementCardIds(
  engagement: NonNullable<PersistedProfileData["engagement"]>,
  cardIdMap: Map<string, string>,
): NonNullable<PersistedProfileData["engagement"]> {
  const next = structuredClone(engagement);

  if (next.featuredLinkId) {
    next.featuredLinkId = cardIdMap.get(next.featuredLinkId);
  }
  if (next.campaign?.primaryLinkId) {
    next.campaign.primaryLinkId = cardIdMap.get(next.campaign.primaryLinkId);
  }

  return next;
}
