import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { writePageChildren } from "@/server/persistence/prisma/repositories/page-children-writer";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import type { ProfileRepository } from "@/server/services/contracts";
import type { PersistedProfileData } from "@/types/persisted-profile";

type PageGraph = Prisma.PageGetPayload<{ include: { smartLink: true; cards: { include: { geoDestinations: true } }; socials: true; stats: true } }>;
function profileData(row: PageGraph): PersistedProfileData {
  const storedAppearance = row.appearance as PersistedProfileData["appearance"] & {
    __media?: { avatarUrl?: string | null; coverImageUrl?: string | null };
    __engagement?: PersistedProfileData["engagement"];
  };
  const { __media, __engagement, ...appearance } = storedAppearance;
  return {
    slug: row.smartLink.slug, displayName: row.displayName, username: row.username ?? undefined, bio: row.bio,
    locationLabel: row.locationLabel ?? undefined, status: row.smartLink.status,
    appearance: appearance as PersistedProfileData["appearance"],
    avatarUrl: __media?.avatarUrl ?? undefined,
    avatarAssetId: row.avatarAssetId ?? undefined,
    coverImageUrl: __media?.coverImageUrl ?? undefined,
    coverAssetId: row.coverAssetId ?? undefined,
    stats: row.stats.sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, value, label, visible }) => ({ id, value, label, visible })),
    socials: row.socials.sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, name, url, visible, platform }) => ({ id, name, url, visible, platform: (platform ?? undefined) as never })),
    contentBlocks: Array.isArray(row.contentBlocks)
      ? structuredClone(row.contentBlocks as PersistedProfileData["contentBlocks"])
      : [],
    engagement: __engagement ? structuredClone(__engagement) : undefined,
    links: row.cards.sort((a, b) => a.sortOrder - b.sortOrder).map((link) => {
      const style = (link.customStyle ?? {}) as Record<string, unknown>;
      const geoDestinations = link.geoDestinations.map(({ id, countryCode, countryName, url }) => ({ id, countryCode, countryName, url }));
      return { id: link.id, title: link.title, description: link.description ?? undefined, url: link.url, visible: link.visible, platform: (link.platform ?? undefined) as never, layout: (link.layout ?? undefined) as never, aspectRatio: (link.aspectRatio ?? undefined) as never, imageFit: (link.imageFit ?? undefined) as never, imagePosition: (link.imagePosition ?? undefined) as never, titlePosition: (link.titlePosition ?? undefined) as never, showPlatformIcon: link.showPlatformIcon, showTitle: link.showTitle, showDescription: link.showDescription, overlayEnabled: link.overlayEnabled, overlayOpacity: link.overlayOpacity ?? undefined, imageUrl: typeof style.__imageUrl === "string" ? style.__imageUrl : undefined, imageAssetId: link.imageAssetId ?? undefined, imageAlt: typeof style.__imageAlt === "string" ? style.__imageAlt : undefined, customStyle: (style.value ?? undefined) as never, availability: availabilityFromStyle(style), sensitiveContent: sensitiveContentFromStyle(style), geo: geoFromStyle(style, geoDestinations), geoDestinations };
    }),
  };
}

function availabilityFromStyle(style: Record<string, unknown>): PersistedProfileData["links"][number]["availability"] {
  const raw = style.__availability;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const availability = raw as Record<string, unknown>;
  return {
    visibleFrom: typeof availability.visibleFrom === "string" ? availability.visibleFrom : undefined,
    visibleUntil: typeof availability.visibleUntil === "string" ? availability.visibleUntil : undefined,
    expiryAction: availability.expiryAction === "DISABLE" ? "DISABLE" : "HIDE",
  };
}

function sensitiveContentFromStyle(style: Record<string, unknown>): PersistedProfileData["links"][number]["sensitiveContent"] {
  const raw = style.__sensitiveContent;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const warning = raw as Record<string, unknown>;
  if (warning.enabled !== true) return undefined;
  return {
    enabled: true,
    title: typeof warning.title === "string" ? warning.title : undefined,
    message: typeof warning.message === "string" ? warning.message : undefined,
    continueLabel: typeof warning.continueLabel === "string" ? warning.continueLabel : undefined,
  };
}

function geoFromStyle(
  style: Record<string, unknown>,
  legacyDestinations: PersistedProfileData["links"][number]["geoDestinations"],
): PersistedProfileData["links"][number]["geo"] {
  const raw = style.__geo;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return structuredClone(raw as NonNullable<PersistedProfileData["links"][number]["geo"]>);
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

const pageInclude = { smartLink: true, cards: { include: { geoDestinations: true } }, socials: true, stats: true } as const;
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserId(userId: string) {
    return (await this.findVersionedByUserId(userId))?.profile ?? null;
  }

  async findVersionedByUserId(userId: string) {
    const row = await this.db.page.findFirst({
      where: { smartLink: { userId, type: "LANDING_PAGE" } },
      orderBy: { createdAt: "asc" },
      include: pageInclude,
    });
    return row ? { profile: profileData(row), revision: row.revision } : null;
  }

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

  async findBySlug(slug: string) {
    const smartLink = await this.db.smartLink.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: { page: { include: pageInclude } },
    });
    return smartLink?.page
      ? { userId: smartLink.userId, profile: profileData(smartLink.page) }
      : null;
  }

  async upsert(userId: string, data: PersistedProfileData) {
    const result = await this.writeLegacyProfile(userId, data);
    if (!result.ok) throw new Error("Unexpected profile revision conflict.");
    return result.profile;
  }

  async updateIfRevision(
    userId: string,
    data: PersistedProfileData,
    expectedRevision: number,
  ) {
    return this.writeLegacyProfile(userId, data, expectedRevision);
  }

  async updateForSmartLinkIfRevision(
    smartLinkId: string,
    userId: string,
    data: PersistedProfileData,
    expectedRevision: number,
  ) {
    const appearance = persistedAppearance(data);

    return this.db.$transaction(async (tx) => {
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
          avatarAssetId: data.avatarAssetId ?? null,
          coverAssetId: data.coverAssetId ?? null,
          appearance: toJson(appearance),
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

  private async writeLegacyProfile(
    userId: string,
    data: PersistedProfileData,
    expectedRevision?: number,
  ) {
    const appearance = persistedAppearance(data);

    return this.db.$transaction(async (tx) => {
      const existingProfile = await tx.page.findFirst({
        where: { smartLink: { userId, type: "LANDING_PAGE" } },
        orderBy: { createdAt: "asc" },
        select: { id: true, smartLinkId: true },
      });
      const base = {
        displayName: data.displayName,
        username: data.username ?? null,
        bio: data.bio,
        locationLabel: data.locationLabel ?? null,
        avatarAssetId: data.avatarAssetId ?? null,
        coverAssetId: data.coverAssetId ?? null,
        appearance: toJson(appearance),
        contentBlocks: toJson(data.contentBlocks),
      };
      const profile = expectedRevision === undefined
        ? existingProfile
          ? await tx.page.update({
              where: { id: existingProfile.id },
              data: { ...base, revision: { increment: 1 } },
            })
          : await (async () => {
              const smartLink = await tx.smartLink.create({
                data: {
                  userId,
                  type: "LANDING_PAGE",
                  title: data.displayName,
                  slug: data.slug.trim().toLowerCase(),
                  status: data.status,
                },
              });
              return tx.page.create({
                data: { smartLinkId: smartLink.id, ...base },
              });
            })()
        : await (async () => {
            if (!existingProfile) return null;
            const updated = await tx.page.updateMany({
              where: { id: existingProfile.id, revision: expectedRevision },
              data: { ...base, revision: { increment: 1 } },
            });
            if (!updated.count) return null;
            return tx.page.findUniqueOrThrow({ where: { id: existingProfile.id } });
          })();

      if (!profile) {
        return { ok: false as const, reason: "REVISION_CONFLICT" as const };
      }

      await tx.smartLink.update({
        where: { id: profile.smartLinkId },
        data: {
          title: data.displayName,
          slug: data.slug.trim().toLowerCase(),
          status: data.status,
          revision: { increment: 1 },
        },
      });

      await writePageChildren(tx, profile.id, data);

      const saved = await tx.page.findUniqueOrThrow({
        where: { id: profile.id },
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

function persistedAppearance(data: PersistedProfileData) {
  return {
    ...data.appearance,
    __media: {
      avatarUrl: data.avatarUrl ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
    },
    __engagement: data.engagement ?? null,
  };
}
