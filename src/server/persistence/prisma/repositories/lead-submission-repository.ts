import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  LeadSubmissionRecord,
  LeadSubmissionRepository,
} from "@/server/services/contracts";

export class PrismaLeadSubmissionRepository implements LeadSubmissionRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(record: LeadSubmissionRecord): Promise<LeadSubmissionRecord> {
    return this.db.leadSubmission.create({
      data: {
        id: record.id,
        smartLinkId: record.smartLinkId,
        blockId: record.blockId,
        email: record.email.trim().toLowerCase(),
        createdAt: record.createdAt,
      },
    });
  }

  async listForSmartLink(smartLinkId: string): Promise<LeadSubmissionRecord[]> {
    return this.db.leadSubmission.findMany({
      where: { smartLinkId },
      orderBy: { createdAt: "desc" },
    });
  }
}

