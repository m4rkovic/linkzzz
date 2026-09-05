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
  imageUrl: string | null;
  imageAlt: string | null;
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
  availability: Prisma.InputJsonValue;
  sensitiveContent: Prisma.InputJsonValue;
  geoConfig: Prisma.InputJsonValue;
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
        imageUrl: link.imageUrl ?? null,
        imageAlt: link.imageAlt ?? null,
        imageFit: link.imageFit ?? null,
        imagePosition: link.imagePosition ?? null,
        titlePosition: link.titlePosition ?? null,
        showPlatformIcon: link.showPlatformIcon ?? true,
        showTitle: link.showTitle ?? true,
        showDescription: link.showDescription ?? true,
        overlayEnabled: link.overlayEnabled ?? false,
        overlayOpacity: link.overlayOpacity ?? null,
        imageAssetId: link.imageAssetId ?? null,
        customStyle: toJson(link.customStyle ?? {}),
        availability: toJson(link.availability ?? {}),
        sensitiveContent: toJson(link.sensitiveContent ?? {}),
        geoConfig: toJson(link.geo ?? {}),
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

  await writeSocialLinks(tx, pageId, data);
  await writePageStats(tx, pageId, data);
  await writePageContentAssetReferences(tx, pageId, data);
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
  const existingWrites = writes
    .filter((write) => write.owned)
    .map((write) => write.data);
  const newWrites = writes
    .filter((write) => !write.owned)
    .map((write) => write.data);

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
  const existingWrites = writes
    .filter((write) => write.owned)
    .map((write) => write.data);
  const newWrites = writes
    .filter((write) => !write.owned)
    .map((write) => write.data);

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

async function writePageContentAssetReferences(
  tx: Prisma.TransactionClient,
  pageId: string,
  data: PersistedProfileData,
) {
  await tx.pageContentAssetReference.deleteMany({ where: { pageId } });

  const unique = new Map<
    string,
    {
      pageId: string;
      blockId: string;
      itemId: string;
      assetId: string;
      sortOrder: number;
    }
  >();

  for (const block of data.contentBlocks) {
    if (block.type !== "GALLERY") continue;
    block.images.forEach((image, sortOrder) => {
      if (!image.imageAssetId) return;
      const key = `${block.id}\u0000${image.id}`;
      if (unique.has(key)) return;
      unique.set(key, {
        pageId,
        blockId: block.id,
        itemId: image.id,
        assetId: image.imageAssetId,
        sortOrder,
      });
    });
  }

  if (unique.size) {
    await tx.pageContentAssetReference.createMany({
      data: [...unique.values()],
    });
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
      "imageUrl" = incoming."imageUrl",
      "imageAlt" = incoming."imageAlt",
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
      "availability" = incoming."availability",
      "sensitiveContent" = incoming."sensitiveContent",
      "geoConfig" = incoming."geoConfig",
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
      "imageUrl" text,
      "imageAlt" text,
      "imageFit" text,
      "imagePosition" text,
      "titlePosition" text,
      "showPlatformIcon" boolean,
      "showTitle" boolean,
      "showDescription" boolean,
      "overlayEnabled" boolean,
      "overlayOpacity" double precision,
      "imageAssetId" text,
      "customStyle" jsonb,
      "availability" jsonb,
      "sensitiveContent" jsonb,
      "geoConfig" jsonb
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
