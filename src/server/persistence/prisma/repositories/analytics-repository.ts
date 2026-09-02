import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  AnalyticsEventRecord,
  AnalyticsRepository,
  AnalyticsSmartLinkRecord,
} from "@/server/services/contracts";

export class PrismaAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(event: AnalyticsEventRecord) {
    return this.db.analyticsEvent.create({
      data: {
        ...event,
        id: event.id,
        createdAt: event.createdAt,
      },
    });
  }

  async createForSlug(slug: string, event: Omit<AnalyticsEventRecord, "smartLinkId">) {
    const smartLink = await this.db.smartLink.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: {
        id: true,
        status: true,
        trackingConfig: true,
        page: { select: { id: true } },
      },
    });
    if (!smartLink || smartLink.status !== "PUBLISHED") return false;

    const tracking = smartLink.trackingConfig as { internalAnalytics?: unknown } | null;
    if (tracking?.internalAnalytics === false) return false;

    if (event.pageCardId) {
      const pageCard = await this.db.pageCard.findFirst({
        where: { id: event.pageCardId, pageId: smartLink.page?.id },
        select: { id: true },
      });
      if (!pageCard) return false;
    }

    await this.create({ ...event, smartLinkId: smartLink.id });
    return true;
  }

  async listForUser(userId: string) {
    return this.db.analyticsEvent.findMany({
      where: { smartLink: { userId } },
      orderBy: { createdAt: "asc" },
    });
  }

  async listForSmartLink(smartLinkId: string, from?: Date) {
    return this.db.analyticsEvent.findMany({
      where: {
        smartLinkId,
        createdAt: from ? { gte: from } : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listSmartLinksForUser(userId: string): Promise<AnalyticsSmartLinkRecord[]> {
    const smartLinks = await this.db.smartLink.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        page: {
          select: {
            cards: {
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                title: true,
                url: true,
              },
            },
          },
        },
      },
    });

    return smartLinks.map((smartLink) => ({
      id: smartLink.id,
      title: smartLink.title,
      slug: smartLink.slug,
      type: smartLink.type,
      status: smartLink.status,
      pageCards: smartLink.page?.cards ?? [],
    }));
  }
}
