import "server-only";

import { randomUUID } from "node:crypto";
import type {
  SubscriptionRecord,
  SubscriptionRepository,
} from "@/server/services/contracts";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredSubscription } from "@/server/persistence/json/types";

function toSubscriptionRecord(subscription: StoredSubscription): SubscriptionRecord {
  return {
    userId: subscription.userId,
    plan: subscription.plan,
    status: subscription.status,
    startedAt: new Date(subscription.startedAt ?? subscription.createdAt),
    expiresAt: subscription.expiresAt ? new Date(subscription.expiresAt) : null,
    autoRenew: subscription.autoRenew,
  };
}

export class JsonSubscriptionRepository implements SubscriptionRepository {
  private readonly store = new JsonArrayStore<StoredSubscription>(
    getJsonDatabaseFile("subscriptions.json"),
  );

  async findByUserId(userId: string): Promise<SubscriptionRecord | null> {
    const subscriptions = await this.store.read();
    const subscription = subscriptions.find((candidate) => candidate.userId === userId);
    return subscription ? toSubscriptionRecord(subscription) : null;
  }

  async upsert(record: SubscriptionRecord): Promise<SubscriptionRecord> {
    return this.store.mutate((subscriptions) => {
      const existing = subscriptions.find((candidate) => candidate.userId === record.userId);
      const now = new Date().toISOString();

      if (existing) {
        existing.plan = record.plan;
        existing.status = record.status;
        existing.startedAt = record.startedAt.toISOString();
        existing.expiresAt = record.expiresAt?.toISOString() ?? null;
        existing.autoRenew = record.autoRenew;
        existing.updatedAt = now;
        return toSubscriptionRecord(existing);
      }

      const created: StoredSubscription = {
        id: randomUUID(),
        userId: record.userId,
        plan: record.plan,
        status: record.status,
        startedAt: record.startedAt.toISOString(),
        expiresAt: record.expiresAt?.toISOString() ?? null,
        autoRenew: record.autoRenew,
        createdAt: now,
        updatedAt: now,
      };

      subscriptions.push(created);
      return toSubscriptionRecord(created);
    });
  }
}
