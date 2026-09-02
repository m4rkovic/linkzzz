import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  SubscriptionRecord,
  SubscriptionRepository,
} from "@/server/services/contracts";

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

