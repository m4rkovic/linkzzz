import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { linkGeoToLegacyDestinations } from "@/features/links/link-geo";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import type { PersistedProfileData } from "@/types/persisted-profile";

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
  for (const [sortOrder, link] of data.links.entries()) {
    const linkData = {
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
    };

    let persistedCardId: string;
    if (ownedCardIds.has(link.id)) {
      const updated = await tx.pageCard.updateMany({
        where: { id: link.id, pageId },
        data: linkData,
      });
      if (updated.count !== 1) {
        throw new Error("Page card ownership changed while the page was being saved.");
      }
      persistedCardId = link.id;
    } else {
      const created = await tx.pageCard.create({
        data: { pageId, ...linkData },
        select: { id: true },
      });
      persistedCardId = created.id;
    }
    cardIdMap.set(link.id, persistedCardId);

    await tx.pageCardGeoDestination.deleteMany({
      where: {
        pageCardId: persistedCardId,
        pageCard: { pageId },
      },
    });

    const geoDestinations = linkGeoToLegacyDestinations(
      link.geo,
      link.geoDestinations,
    );
    if (geoDestinations.length) {
      await tx.pageCardGeoDestination.createMany({
        data: geoDestinations.map((destination) => ({
          pageCardId: persistedCardId,
          countryCode: destination.countryCode,
          countryName: destination.countryName,
          url: destination.url,
        })),
      });
    }
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

  for (const [sortOrder, social] of data.socials.entries()) {
    const socialData = {
      name: social.name,
      url: social.url,
      visible: social.visible,
      platform: social.platform ?? null,
      sortOrder,
    };
    if (ownedIds.has(social.id)) {
      const updated = await tx.socialLink.updateMany({
        where: { id: social.id, pageId },
        data: socialData,
      });
      if (updated.count !== 1) {
        throw new Error("Social link ownership changed while the page was being saved.");
      }
    } else {
      await tx.socialLink.create({ data: { pageId, ...socialData } });
    }
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

  for (const [sortOrder, stat] of stats.entries()) {
    const statData = {
      value: stat.value,
      label: stat.label,
      visible: stat.visible,
      sortOrder,
    };
    if (ownedIds.has(stat.id)) {
      const updated = await tx.pageStat.updateMany({
        where: { id: stat.id, pageId },
        data: statData,
      });
      if (updated.count !== 1) {
        throw new Error("Page stat ownership changed while the page was being saved.");
      }
    } else {
      await tx.pageStat.create({ data: { pageId, ...statData } });
    }
  }
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
