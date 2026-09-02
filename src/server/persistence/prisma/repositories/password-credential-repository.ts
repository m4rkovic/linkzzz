import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { PasswordCredentialRepository } from "@/server/services/contracts";

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

