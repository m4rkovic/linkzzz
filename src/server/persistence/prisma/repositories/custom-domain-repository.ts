import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type {
  AdminCustomDomainRecord,
  CustomDomainRecord,
  CustomDomainRepository,
} from "@/server/services/contracts";

export class PrismaCustomDomainRepository implements CustomDomainRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveSlugByDomain(domain: string, verifiedAfter: Date) {
    return (
      await this.db.customDomain.findFirst({
        where: {
          domain: normalize(domain),
          status: "ACTIVE",
          verifiedAt: { gt: verifiedAfter },
          smartLink: {
            status: "PUBLISHED",
            user: {
              accountStatus: "ACTIVE",
              subscription: {
                status: { in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] },
                endsAt: { gt: new Date() },
              },
            },
          },
        },
        select: { smartLink: { select: { slug: true } } },
      })
    )?.smartLink.slug ?? null;
  }

  async listForSmartLink(userId: string, smartLinkId: string) {
    return this.db.customDomain.findMany({
      where: { smartLinkId, smartLink: { userId } },
      orderBy: { createdAt: "asc" },
    });
  }

  async listForAdmin(limit: number): Promise<AdminCustomDomainRecord[]> {
    const rows = await this.db.customDomain.findMany({
      include: {
        smartLink: {
          select: {
            title: true,
            slug: true,
            user: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return rows.map(({ smartLink, ...domain }) => ({
      ...domain,
      ownerUserId: smartLink.user.id,
      ownerUsername: smartLink.user.username,
      smartLinkTitle: smartLink.title,
      smartLinkSlug: smartLink.slug,
    }));
  }

  async claimForSmartLink(
    userId: string,
    smartLinkId: string,
    domain: string,
    verificationToken: string,
    expiredBefore: Date,
  ) {
    const normalizedDomain = normalize(domain);

    return this.db.$transaction(async (tx) => {
      const smartLink = await tx.smartLink.findFirst({
        where: { id: smartLinkId, userId },
        select: { id: true },
      });
      if (!smartLink) throw new Error("Smart Link not found.");

      await tx.$executeRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`custom-domain:${normalizedDomain}`}))`,
      );

      const existing = await tx.customDomain.findUnique({
        where: { domain: normalizedDomain },
        include: { smartLink: { select: { userId: true } } },
      });

      if (!existing) {
        const record = await tx.customDomain.create({
          data: {
            smartLinkId: smartLink.id,
            domain: normalizedDomain,
            verificationToken,
            status: "PENDING",
          },
        });
        return { record, reclaimed: false };
      }

      if (
        existing.status !== "PENDING" ||
        existing.updatedAt.getTime() > expiredBefore.getTime()
      ) {
        return null;
      }

      const record = await tx.customDomain.update({
        where: { id: existing.id },
        data: {
          smartLinkId: smartLink.id,
          status: "PENDING",
          verificationToken,
          verifiedAt: null,
        },
      });
      return {
        record,
        reclaimed: true,
        previousOwnerUserId: existing.smartLink.userId,
      };
    });
  }

  async setStatusForSmartLink(
    userId: string,
    smartLinkId: string,
    domain: string,
    status: CustomDomainRecord["status"],
    verifiedAt?: Date | null,
  ) {
    const existing = await this.db.customDomain.findFirst({
      where: {
        smartLinkId,
        domain: normalize(domain),
        smartLink: { userId },
      },
      select: { id: true },
    });
    if (!existing) return null;

    return this.db.customDomain.update({
      where: { id: existing.id },
      data: { status, verifiedAt },
    });
  }

  async deleteForSmartLink(
    userId: string,
    smartLinkId: string,
    domain: string,
  ) {
    return (
      await this.db.customDomain.deleteMany({
        where: {
          smartLinkId,
          domain: normalize(domain),
          smartLink: { userId },
        },
      })
    ).count > 0;
  }

  async releaseById(id: string) {
    return this.db.$transaction(async (tx) => {
      const existing = await tx.customDomain.findUnique({
        where: { id },
        include: { smartLink: { select: { userId: true } } },
      });
      if (!existing) return null;

      const deleted = await tx.customDomain.deleteMany({ where: { id } });
      if (deleted.count !== 1) return null;

      const { smartLink, ...domain } = existing;
      return { domain, ownerUserId: smartLink.userId };
    });
  }
}

function normalize(domain: string) {
  return domain.trim().toLowerCase();
}
