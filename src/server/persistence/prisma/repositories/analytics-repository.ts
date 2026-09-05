import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import { buildAnalyticsDashboardFromSummaries } from "@/features/analytics/analytics-summary-builder";
import { getSubscriptionAccess } from "@/server/business/subscriptions";
import { queryAnalyticsPeriodSummaries } from "@/server/persistence/prisma/repositories/analytics-summary-query";
import type {
  AnalyticsEventRecord,
  AnalyticsDashboardSummary,
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
        user: {
          select: {
            accountStatus: true,
            subscription: { select: { status: true, endsAt: true } },
          },
        },
      },
    });
    if (!smartLink || smartLink.status !== "PUBLISHED") return false;
    if (smartLink.user.accountStatus !== "ACTIVE") return false;
    const subscription = smartLink.user.subscription;
    if (
      !subscription ||
      !getSubscriptionAccess(subscription.status, subscription.endsAt).hasAccess
    ) {
      return false;
    }

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

  async summarizeDashboard(userId: string): Promise<AnalyticsDashboardSummary> {
    type LinkCountRow = {
      smartLinkId: string;
      smartViews: number;
      legacyViews: number;
      clicks: number;
    };
    type UniqueCountRow = { count: number };

    const [links, unique] = await Promise.all([
      this.db.$queryRaw<LinkCountRow[]>`
        SELECT
          event."smartLinkId" AS "smartLinkId",
          COUNT(*) FILTER (WHERE event."type" = 'SMART_LINK_VIEW')::int AS "smartViews",
          COUNT(*) FILTER (WHERE event."type" = 'PAGE_VIEW')::int AS "legacyViews",
          COUNT(*) FILTER (WHERE event."type" IN ('LINK_CLICK', 'SOCIAL_CLICK'))::int AS "clicks"
        FROM "AnalyticsEvent" AS event
        INNER JOIN "SmartLink" AS link ON link."id" = event."smartLinkId"
        WHERE link."userId" = ${userId}
          AND event."isBot" = FALSE
          AND event."type" IN ('SMART_LINK_VIEW', 'PAGE_VIEW', 'LINK_CLICK', 'SOCIAL_CLICK')
        GROUP BY event."smartLinkId"
      `,
      this.db.$queryRaw<UniqueCountRow[]>`
        SELECT COUNT(DISTINCT event."visitorId")::int AS "count"
        FROM "AnalyticsEvent" AS event
        INNER JOIN "SmartLink" AS link ON link."id" = event."smartLinkId"
        WHERE link."userId" = ${userId}
          AND event."isBot" = FALSE
          AND event."visitorId" IS NOT NULL
          AND event."type" IN ('SMART_LINK_VIEW', 'PAGE_VIEW')
      `,
    ]);

    return {
      links,
      uniqueVisitors: unique[0]?.count ?? 0,
    };
  }

  async getDashboardData(userId: string, scopeSmartLinkId?: string) {
    const smartLinks = await this.listSmartLinksForUser(userId);
    if (
      scopeSmartLinkId &&
      !smartLinks.some((smartLink) => smartLink.id === scopeSmartLinkId)
    ) {
      return null;
    }

    const now = new Date();
    const summaries = await queryAnalyticsPeriodSummaries(
      this.db,
      userId,
      scopeSmartLinkId,
      now,
    );
    return buildAnalyticsDashboardFromSummaries({
      summaries,
      smartLinks,
      scopeSmartLinkId,
      now,
    });
  }

  private async listSmartLinksForUser(
    userId: string,
  ): Promise<AnalyticsSmartLinkRecord[]> {
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
