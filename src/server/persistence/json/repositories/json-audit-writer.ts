import "server-only";

import { randomUUID } from "node:crypto";
import type { AuditEventInput, AuditEventRecord, AuditWriter } from "@/server/audit/types";
import { JsonArrayStore } from "@/server/persistence/json/json-store";
import { getJsonDatabaseFile } from "@/server/persistence/json/paths";
import type { StoredAuditEvent } from "@/server/persistence/json/types";

export class JsonAuditWriter implements AuditWriter {
  private readonly store = new JsonArrayStore<StoredAuditEvent>(
    getJsonDatabaseFile("audit-log.json"),
  );

  async write(event: AuditEventInput): Promise<void> {
    await this.store.mutate((events) => {
      events.push({
        id: randomUUID(),
        timestamp: new Date().toISOString(),
        ...event,
      });
    });
  }

  async listForUser(userId: string): Promise<AuditEventRecord[]> {
    const events = await this.store.read();
    return events
      .filter((event) => event.actorUserId === userId || event.targetUserId === userId)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }
}
