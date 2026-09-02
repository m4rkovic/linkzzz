import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionRepository } from "@/server/services/contracts";

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

