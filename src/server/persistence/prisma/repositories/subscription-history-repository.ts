import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  SubscriptionHistoryRecord,
  SubscriptionHistoryRepository,
} from "@/server/services/contracts";

export class PrismaSubscriptionHistoryRepository implements SubscriptionHistoryRepository {
  constructor(private readonly db: PrismaClient) {}
  async listForUser(userId: string): Promise<SubscriptionHistoryRecord[]> { const rows = await this.db.subscriptionHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }); return rows.map((row) => ({ id: row.id, userId, plan: row.plan, status: row.status, startedAt: row.startsAt ?? row.createdAt, expiresAt: row.endsAt, autoRenew: false, action: row.action, metadata: row.metadata as Record<string, unknown> | null, createdAt: row.createdAt })); }
}

