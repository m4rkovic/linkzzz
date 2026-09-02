import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  CustomDomainRecord,
  CustomDomainRepository,
} from "@/server/services/contracts";

export class PrismaCustomDomainRepository implements CustomDomainRepository {
  constructor(private readonly db: PrismaClient) {}
  async findByDomain(domain: string) { return this.db.customDomain.findUnique({ where: { domain: domain.trim().toLowerCase() } }); }
  async findActiveSlugByDomain(domain: string) { return (await this.db.customDomain.findFirst({ where: { domain: domain.trim().toLowerCase(), status: "ACTIVE", smartLink: { status: "PUBLISHED", user: { accountStatus: "ACTIVE", subscription: { status: { in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] }, endsAt: { gt: new Date() } } } } }, select: { smartLink: { select: { slug: true } } } }))?.smartLink.slug ?? null; }
  async listForUser(userId: string) { return this.db.customDomain.findMany({ where: { smartLink: { userId } }, orderBy: { createdAt: "asc" } }); }
  async listForSmartLink(userId: string, smartLinkId: string) { return this.db.customDomain.findMany({ where: { smartLinkId, smartLink: { userId } }, orderBy: { createdAt: "asc" } }); }
  async createForSmartLink(userId: string, smartLinkId: string, domain: string, verificationToken: string) {
    const smartLink = await this.db.smartLink.findFirst({ where: { id: smartLinkId, userId }, select: { id: true } });
    if (!smartLink) throw new Error("SmartLink not found.");
    return this.db.customDomain.create({ data: { smartLinkId: smartLink.id, domain: domain.trim().toLowerCase(), verificationToken, status: "PENDING" } });
  }
  async upsert(record: CustomDomainRecord) { const domain = record.domain.trim().toLowerCase(); return this.db.customDomain.upsert({ where: { domain }, create: { ...record, domain }, update: { smartLinkId: record.smartLinkId, status: record.status, verificationToken: record.verificationToken, verifiedAt: record.verifiedAt } }); }
  async setStatusForSmartLink(userId: string, smartLinkId: string, domain: string, status: CustomDomainRecord["status"], verifiedAt?: Date | null) {
    const existing = await this.db.customDomain.findFirst({ where: { smartLinkId, domain: domain.trim().toLowerCase(), smartLink: { userId } }, select: { id: true } });
    if (!existing) return null;
    return this.db.customDomain.update({ where: { id: existing.id }, data: { status, verifiedAt } });
  }
  async deleteForSmartLink(userId: string, smartLinkId: string, domain: string) { return (await this.db.customDomain.deleteMany({ where: { smartLinkId, domain: domain.trim().toLowerCase(), smartLink: { userId } } })).count > 0; }
}

