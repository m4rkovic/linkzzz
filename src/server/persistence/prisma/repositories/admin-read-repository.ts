import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type {
  AdminCustomerReadRecord,
  AdminReadRepository,
} from "@/server/services/contracts";

export class PrismaAdminReadRepository implements AdminReadRepository {
  constructor(private readonly db: PrismaClient) {}

  async listCustomers(): Promise<AdminCustomerReadRecord[]> {
    const customers = await this.db.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        accountStatus: true,
        subscription: {
          select: {
            userId: true,
            plan: true,
            status: true,
            startsAt: true,
            endsAt: true,
            autoRenew: true,
          },
        },
        smartLinks: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            updatedAt: true,
            page: { select: { displayName: true } },
          },
        },
      },
    });

    return customers.map((customer) => {
      const subscription = customer.subscription;
      const landingPage = customer.smartLinks.find(
        (smartLink) => smartLink.type === "LANDING_PAGE",
      );
      if (!subscription || !landingPage?.page) {
        throw new Error("Customer data is incomplete.");
      }
      const displayName = landingPage.page.displayName || customer.username;

      return {
        user: {
          id: customer.id,
          username: customer.username,
          email: customer.email,
          role: customer.role,
          accountStatus: customer.accountStatus,
        },
        displayName,
        subscription: {
          userId: subscription.userId,
          plan: subscription.plan,
          status: subscription.status,
          startedAt: subscription.startsAt,
          expiresAt: subscription.endsAt,
          autoRenew: subscription.autoRenew,
        },
        smartLinks: customer.smartLinks.map((smartLink) => ({
          id: smartLink.id,
          title: smartLink.title,
          slug: smartLink.slug,
          type: smartLink.type,
          status: smartLink.status,
          updatedAt: smartLink.updatedAt,
        })),
      };
    });
  }
}
