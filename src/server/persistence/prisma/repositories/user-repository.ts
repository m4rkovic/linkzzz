import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { UserRecord, UserRepository } from "@/server/services/contracts";

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

