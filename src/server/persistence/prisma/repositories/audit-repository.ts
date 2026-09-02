import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { toJson } from "@/server/persistence/prisma/repositories/json";
import type { AuditEventInput, AuditEventRecord } from "@/server/audit/types";

export class PrismaAuditRepository {
  constructor(private readonly db: PrismaClient) {}
  async write(event: AuditEventInput) { await this.db.auditLog.create({ data: { actorUserId: event.actorUserId, targetUserId: event.targetUserId, action: event.action, resourceType: event.resourceType, resourceId: event.resourceId, metadata: event.metadata ? toJson(event.metadata) : undefined } }); }
  async listForUser(userId: string): Promise<AuditEventRecord[]> { const rows = await this.db.auditLog.findMany({ where: { OR: [{ actorUserId: userId }, { targetUserId: userId }] }, orderBy: { createdAt: "desc" } }); return rows.map((row) => ({ id: row.id, timestamp: row.createdAt.toISOString(), actorUserId: row.actorUserId ?? "system", targetUserId: row.targetUserId ?? undefined, action: row.action as AuditEventRecord["action"], resourceType: row.resourceType as AuditEventRecord["resourceType"], resourceId: row.resourceId ?? undefined, metadata: (row.metadata ?? undefined) as AuditEventRecord["metadata"] })); }
}

