import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { AuditEventInput, AuditEventRecord } from "@/server/audit/types";
import type {
  AnalyticsEventRecord,
  AnalyticsRepository,
  AssetRecord,
  AssetRepository,
  CustomDomainRecord,
  CustomDomainRepository,
  CustomerProvisioningRepository,
  PasswordCredentialRepository,
  ProfileRepository,
  SessionRepository,
  SubscriptionHistoryRecord,
  SubscriptionHistoryRepository,
  SubscriptionRecord,
  SubscriptionRepository,
  UserRecord,
  UserRepository,
  ProvisionCustomerInput,
} from "@/server/services/contracts";
import type { PersistedProfileData } from "@/types/persisted-profile";

const json = (value: unknown) => value as Prisma.InputJsonValue;

export class PrismaCustomerProvisioningRepository
  implements CustomerProvisioningRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: ProvisionCustomerInput): Promise<UserRecord> {
    const expiresAt = input.subscription.expiresAt;
    if (!expiresAt) throw new Error("A subscription expiry date is required.");

    return this.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: input.username.trim().toLowerCase(),
          email: input.email.trim().toLowerCase(),
          displayName: input.profile.displayName,
          role: "CUSTOMER",
          accountStatus: "ACTIVE",
        },
      });

      await tx.passwordCredential.create({
        data: {
          userId: user.id,
          passwordHash: input.passwordHash,
          mustChangePassword: input.mustChangePassword,
        },
      });

      await tx.subscription.create({
        data: {
          userId: user.id,
          plan: input.subscription.plan,
          status: input.subscription.status,
          startsAt: input.subscription.startedAt,
          endsAt: expiresAt,
          autoRenew: input.subscription.autoRenew,
        },
      });

      await tx.subscriptionHistory.create({
        data: {
          userId: user.id,
          plan: input.subscription.plan,
          status: input.subscription.status,
          startsAt: input.subscription.startedAt,
          endsAt: expiresAt,
          action: "CREATED",
          metadata: json({ initial: true }),
        },
      });

      await tx.profile.create({
        data: {
          userId: user.id,
          slug: input.profile.slug.trim().toLowerCase(),
          status: input.profile.status,
          displayName: input.profile.displayName,
          username: input.profile.username,
          bio: input.profile.bio,
          locationLabel: input.profile.locationLabel,
          appearance: json(input.profile.appearance),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: user.id,
          action: "USER_CREATED",
          resourceType: "USER",
          resourceId: user.id,
          metadata: json({ plan: input.subscription.plan, slug: input.profile.slug }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: input.actorUserId,
          targetUserId: user.id,
          action: "SUBSCRIPTION_RENEWED",
          resourceType: "SUBSCRIPTION",
          resourceId: user.id,
          metadata: json({ months: 0, initial: true }),
        },
      });

      return user;
    });
  }
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: PrismaClient) {}
  async findById(id: string) { return this.db.user.findUnique({ where: { id } }); }
  async findByLogin(login: string) {
    const normalized = login.trim().toLowerCase();
    return this.db.user.findFirst({ where: { OR: [{ username: normalized }, { email: normalized }] } });
  }
  async list() { return this.db.user.findMany({ orderBy: { createdAt: "asc" } }); }
  async create(input: Omit<UserRecord, "id">) {
    return this.db.user.create({ data: { ...input, username: input.username.trim().toLowerCase(), email: input.email.trim().toLowerCase() } });
  }
  async update(id: string, patch: Partial<Pick<UserRecord, "username" | "email" | "role" | "accountStatus">>) {
    const existing = await this.db.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;
    return this.db.user.update({ where: { id }, data: { ...patch, username: patch.username?.trim().toLowerCase(), email: patch.email?.trim().toLowerCase() } });
  }
}

export class PrismaPasswordCredentialRepository implements PasswordCredentialRepository {
  constructor(private readonly db: PrismaClient) {}
  async getPasswordHash(userId: string) { return (await this.db.passwordCredential.findUnique({ where: { userId }, select: { passwordHash: true } }))?.passwordHash ?? null; }
  async setPasswordHash(userId: string, passwordHash: string) {
    await this.db.passwordCredential.upsert({ where: { userId }, create: { userId, passwordHash }, update: { passwordHash } });
  }
  async getMustChangePassword(userId: string) { return (await this.db.passwordCredential.findUnique({ where: { userId }, select: { mustChangePassword: true } }))?.mustChangePassword ?? false; }
  async setMustChangePassword(userId: string, mustChangePassword: boolean) {
    await this.db.passwordCredential.update({ where: { userId }, data: { mustChangePassword } });
  }
}

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaClient) {}
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }) { return this.db.session.create({ data: input, select: { id: true } }); }
  async findValidByTokenHash(tokenHash: string, now: Date) {
    return this.db.session.findFirst({ where: { tokenHash, revokedAt: null, expiresAt: { gt: now } }, select: { id: true, userId: true, expiresAt: true } });
  }
  async revokeById(id: string) { await this.db.session.updateMany({ where: { id, revokedAt: null }, data: { revokedAt: new Date() } }); }
  async revokeAllForUser(userId: string) { await this.db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }); }
  async deleteExpired(now: Date) { return (await this.db.session.deleteMany({ where: { expiresAt: { lte: now } } })).count; }
}

function subscription(row: { userId: string; plan: SubscriptionRecord["plan"]; status: SubscriptionRecord["status"]; startsAt: Date; endsAt: Date; autoRenew: boolean }): SubscriptionRecord {
  return { userId: row.userId, plan: row.plan, status: row.status, startedAt: row.startsAt, expiresAt: row.endsAt, autoRenew: row.autoRenew };
}

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: PrismaClient) {}
  async findByUserId(userId: string) { const row = await this.db.subscription.findUnique({ where: { userId } }); return row ? subscription(row) : null; }
  async upsert(record: SubscriptionRecord) {
    if (!record.expiresAt) throw new Error("A subscription expiry date is required by the current Prisma schema.");
    const row = await this.db.$transaction(async (tx) => {
      const saved = await tx.subscription.upsert({ where: { userId: record.userId }, create: { userId: record.userId, plan: record.plan, status: record.status, startsAt: record.startedAt, endsAt: record.expiresAt!, autoRenew: record.autoRenew }, update: { plan: record.plan, status: record.status, startsAt: record.startedAt, endsAt: record.expiresAt!, autoRenew: record.autoRenew } });
      await tx.subscriptionHistory.create({ data: { userId: record.userId, plan: record.plan, status: record.status, startsAt: record.startedAt, endsAt: record.expiresAt, action: "UPSERT" } });
      return saved;
    });
    return subscription(row);
  }
}

type ProfileGraph = Prisma.ProfileGetPayload<{ include: { links: { include: { geoDestinations: true } }; socials: true; stats: true } }>;
function profileData(row: ProfileGraph): PersistedProfileData {
  const storedAppearance = row.appearance as PersistedProfileData["appearance"] & {
    __media?: { avatarUrl?: string | null; coverImageUrl?: string | null };
  };
  const { __media, ...appearance } = storedAppearance;
  return {
    slug: row.slug, displayName: row.displayName, username: row.username ?? undefined, bio: row.bio,
    locationLabel: row.locationLabel ?? undefined, status: row.status,
    appearance: appearance as PersistedProfileData["appearance"],
    avatarUrl: __media?.avatarUrl ?? undefined,
    avatarAssetId: row.avatarAssetId ?? undefined,
    coverImageUrl: __media?.coverImageUrl ?? undefined,
    coverAssetId: row.coverAssetId ?? undefined,
    stats: row.stats.sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, value, label, visible }) => ({ id, value, label, visible })),
    socials: row.socials.sort((a, b) => a.sortOrder - b.sortOrder).map(({ id, name, url, visible, platform }) => ({ id, name, url, visible, platform: (platform ?? undefined) as never })),
    links: row.links.sort((a, b) => a.sortOrder - b.sortOrder).map((link) => {
      const style = (link.customStyle ?? {}) as Record<string, unknown>;
      return { id: link.id, title: link.title, description: link.description ?? undefined, url: link.url, visible: link.visible, platform: (link.platform ?? undefined) as never, layout: (link.layout ?? undefined) as never, aspectRatio: (link.aspectRatio ?? undefined) as never, imageFit: (link.imageFit ?? undefined) as never, imagePosition: (link.imagePosition ?? undefined) as never, titlePosition: (link.titlePosition ?? undefined) as never, showPlatformIcon: link.showPlatformIcon, showTitle: link.showTitle, showDescription: link.showDescription, overlayEnabled: link.overlayEnabled, overlayOpacity: link.overlayOpacity ?? undefined, imageUrl: typeof style.__imageUrl === "string" ? style.__imageUrl : undefined, imageAssetId: link.imageAssetId ?? undefined, imageAlt: typeof style.__imageAlt === "string" ? style.__imageAlt : undefined, customStyle: (style.value ?? undefined) as never, geoDestinations: link.geoDestinations.map(({ id, countryCode, countryName, url }) => ({ id, countryCode, countryName, url })) };
    }),
  };
}

const profileInclude = { links: { include: { geoDestinations: true } }, socials: true, stats: true } as const;
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: PrismaClient) {}
  async findByUserId(userId: string) { return (await this.findVersionedByUserId(userId))?.profile ?? null; }
  async findVersionedByUserId(userId: string) {
    const row = await this.db.profile.findUnique({ where: { userId }, include: profileInclude });
    return row ? { profile: profileData(row), revision: row.revision } : null;
  }
  async findBySlug(slug: string) { const row = await this.db.profile.findUnique({ where: { slug: slug.trim().toLowerCase() }, include: profileInclude }); return row ? { userId: row.userId, profile: profileData(row) } : null; }
  async upsert(userId: string, data: PersistedProfileData) {
    const result = await this.writeProfile(userId, data);
    if (!result.ok) throw new Error("Unexpected profile revision conflict.");
    return result.profile;
  }
  async updateIfRevision(userId: string, data: PersistedProfileData, expectedRevision: number) {
    return this.writeProfile(userId, data, expectedRevision);
  }
  private async writeProfile(userId: string, data: PersistedProfileData, expectedRevision?: number) {
    const appearance = {
      ...data.appearance,
      __media: {
        avatarUrl: data.avatarUrl ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
      },
    };
    return this.db.$transaction(async (tx) => {
      const base = {
        slug: data.slug.trim().toLowerCase(),
        status: data.status,
        displayName: data.displayName,
        username: data.username ?? null,
        bio: data.bio,
        locationLabel: data.locationLabel ?? null,
        avatarAssetId: data.avatarAssetId ?? null,
        coverAssetId: data.coverAssetId ?? null,
        appearance: json(appearance),
      };
      const profile = expectedRevision === undefined
        ? await tx.profile.upsert({
            where: { userId },
            create: { userId, ...base },
            update: { ...base, revision: { increment: 1 } },
          })
        : await (async () => {
            const updated = await tx.profile.updateMany({
              where: { userId, revision: expectedRevision },
              data: { ...base, revision: { increment: 1 } },
            });
            if (!updated.count) return null;
            return tx.profile.findUniqueOrThrow({ where: { userId } });
          })();

      if (!profile) {
        return { ok: false as const, reason: "REVISION_CONFLICT" as const };
      }

      const linkIds = data.links.map((link) => link.id);
      await tx.link.deleteMany({
        where: {
          profileId: profile.id,
          ...(linkIds.length ? { id: { notIn: linkIds } } : {}),
        },
      });

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
          customStyle: json({
            value: link.customStyle ?? null,
            __imageUrl: link.imageUrl ?? null,
            __imageAlt: link.imageAlt ?? null,
          }),
        };
        const updated = await tx.link.updateMany({
          where: { id: link.id, profileId: profile.id },
          data: linkData,
        });
        if (!updated.count) {
          await tx.link.create({
            data: { id: link.id, profileId: profile.id, ...linkData },
          });
        }

        await tx.geoDestination.deleteMany({ where: { linkId: link.id } });
        if (link.geoDestinations.length) {
          await tx.geoDestination.createMany({
            data: link.geoDestinations.map((destination) => ({
              id: destination.id,
              linkId: link.id,
              countryCode: destination.countryCode,
              countryName: destination.countryName,
              url: destination.url,
            })),
          });
        }
      }

      const socialIds = data.socials.map((social) => social.id);
      await tx.socialLink.deleteMany({
        where: {
          profileId: profile.id,
          ...(socialIds.length ? { id: { notIn: socialIds } } : {}),
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
        const updated = await tx.socialLink.updateMany({
          where: { id: social.id, profileId: profile.id },
          data: socialData,
        });
        if (!updated.count) {
          await tx.socialLink.create({
            data: { id: social.id, profileId: profile.id, ...socialData },
          });
        }
      }

      const stats = data.stats ?? [];
      const statIds = stats.map((stat) => stat.id);
      await tx.profileStat.deleteMany({
        where: {
          profileId: profile.id,
          ...(statIds.length ? { id: { notIn: statIds } } : {}),
        },
      });
      for (const [sortOrder, stat] of stats.entries()) {
        const statData = {
          value: stat.value,
          label: stat.label,
          visible: stat.visible,
          sortOrder,
        };
        const updated = await tx.profileStat.updateMany({
          where: { id: stat.id, profileId: profile.id },
          data: statData,
        });
        if (!updated.count) {
          await tx.profileStat.create({
            data: { id: stat.id, profileId: profile.id, ...statData },
          });
        }
      }

      const saved = await tx.profile.findUniqueOrThrow({
        where: { id: profile.id },
        include: profileInclude,
      });
      return {
        ok: true as const,
        profile: profileData(saved),
        revision: saved.revision,
      };
    });
  }
}

export class PrismaAuditRepository {
  constructor(private readonly db: PrismaClient) {}
  async write(event: AuditEventInput) { await this.db.auditLog.create({ data: { actorUserId: event.actorUserId, targetUserId: event.targetUserId, action: event.action, resourceType: event.resourceType, resourceId: event.resourceId, metadata: event.metadata ? json(event.metadata) : undefined } }); }
  async listForUser(userId: string): Promise<AuditEventRecord[]> { const rows = await this.db.auditLog.findMany({ where: { OR: [{ actorUserId: userId }, { targetUserId: userId }] }, orderBy: { createdAt: "desc" } }); return rows.map((row) => ({ id: row.id, timestamp: row.createdAt.toISOString(), actorUserId: row.actorUserId ?? "system", targetUserId: row.targetUserId ?? undefined, action: row.action as AuditEventRecord["action"], resourceType: row.resourceType as AuditEventRecord["resourceType"], resourceId: row.resourceId ?? undefined, metadata: (row.metadata ?? undefined) as AuditEventRecord["metadata"] })); }
}

export class PrismaSubscriptionHistoryRepository implements SubscriptionHistoryRepository {
  constructor(private readonly db: PrismaClient) {}
  async listForUser(userId: string): Promise<SubscriptionHistoryRecord[]> { const rows = await this.db.subscriptionHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }); return rows.map((row) => ({ id: row.id, userId, plan: row.plan, status: row.status, startedAt: row.startsAt ?? row.createdAt, expiresAt: row.endsAt, autoRenew: false, action: row.action, metadata: row.metadata as Record<string, unknown> | null, createdAt: row.createdAt })); }
}

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}
  async create(event: AnalyticsEventRecord) { return this.db.analyticsEvent.create({ data: { ...event, id: event.id, createdAt: event.createdAt } }); }
  async createForSlug(slug: string, event: Omit<AnalyticsEventRecord, "profileId">) {
    const profile = await this.db.profile.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: { id: true, status: true },
    });
    if (!profile || profile.status !== "PUBLISHED") return false;
    if (event.linkId) {
      const link = await this.db.link.findFirst({ where: { id: event.linkId, profileId: profile.id }, select: { id: true } });
      if (!link) return false;
    }
    await this.create({ ...event, profileId: profile.id });
    return true;
  }
  async listForUser(userId: string) { return this.db.analyticsEvent.findMany({ where: { profile: { userId }, isBot: false }, orderBy: { createdAt: "asc" } }); }
  async listForProfile(profileId: string, from?: Date) { return this.db.analyticsEvent.findMany({ where: { profileId, createdAt: from ? { gte: from } : undefined }, orderBy: { createdAt: "desc" } }); }
}

export class PrismaAssetRepository implements AssetRepository {
  constructor(private readonly db: PrismaClient) {}
  async findById(id: string) { return this.db.asset.findUnique({ where: { id } }); }
  async findByIdsForUser(userId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.db.asset.findMany({
      where: { id: { in: ids }, profile: { userId } },
    });
  }
  async create(asset: AssetRecord) { return this.db.asset.create({ data: asset }); }
  async createForUser(userId: string, asset: Omit<AssetRecord, "profileId">) {
    const profile = await this.db.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new Error("Profile not found.");
    return this.create({ ...asset, profileId: profile.id });
  }
  async delete(id: string) { await this.db.asset.deleteMany({ where: { id } }); }
  async deleteUnusedForUser(userId: string, ids: string[]) {
    if (!ids.length) return [];
    return this.db.$transaction(async (tx) => {
      const unused = await tx.asset.findMany({
        where: {
          id: { in: ids },
          profile: { userId },
          avatarFor: { none: {} },
          coverFor: { none: {} },
          imageFor: { none: {} },
        },
      });
      if (unused.length) {
        await tx.asset.deleteMany({
          where: { id: { in: unused.map((asset) => asset.id) } },
        });
      }
      return unused;
    });
  }
}

export class PrismaCustomDomainRepository implements CustomDomainRepository {
  constructor(private readonly db: PrismaClient) {}
  async findByDomain(domain: string) { return this.db.customDomain.findUnique({ where: { domain: domain.trim().toLowerCase() } }); }
  async findActiveSlugByDomain(domain: string) { return (await this.db.customDomain.findFirst({ where: { domain: domain.trim().toLowerCase(), status: "ACTIVE", profile: { status: "PUBLISHED", user: { accountStatus: "ACTIVE", subscription: { status: { in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] }, endsAt: { gt: new Date() } } } } }, select: { profile: { select: { slug: true } } } }))?.profile.slug ?? null; }
  async listForUser(userId: string) { return this.db.customDomain.findMany({ where: { profile: { userId } }, orderBy: { createdAt: "asc" } }); }
  async createForUser(userId: string, domain: string, verificationToken: string) {
    const profile = await this.db.profile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new Error("Profile not found.");
    return this.db.customDomain.create({ data: { profileId: profile.id, domain: domain.trim().toLowerCase(), verificationToken, status: "PENDING" } });
  }
  async upsert(record: CustomDomainRecord) { const domain = record.domain.trim().toLowerCase(); return this.db.customDomain.upsert({ where: { domain }, create: { ...record, domain }, update: { profileId: record.profileId, status: record.status, verificationToken: record.verificationToken, verifiedAt: record.verifiedAt } }); }
  async setStatusForUser(userId: string, domain: string, status: CustomDomainRecord["status"], verifiedAt?: Date | null) {
    const existing = await this.db.customDomain.findFirst({ where: { domain: domain.trim().toLowerCase(), profile: { userId } }, select: { id: true } });
    if (!existing) return null;
    return this.db.customDomain.update({ where: { id: existing.id }, data: { status, verifiedAt } });
  }
  async deleteForUser(userId: string, domain: string) { return (await this.db.customDomain.deleteMany({ where: { domain: domain.trim().toLowerCase(), profile: { userId } } })).count > 0; }
}
