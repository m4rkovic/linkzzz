import type { AdminHistoryItem, AdminUserModel } from "@/features/admin/admin-types";

export function createMockAdminUser(userId: string): AdminUserModel {
  return {
    id: userId,
    displayName: "Sky Hook",
    username: "skyhook",
    email: "contact@skyhook.rs",
    slug: "skyhook",
    initials: "SH",
    plan: "PREMIUM_PLUS",
    subscriptionStatus: "ACTIVE",
    accountStatus: "ACTIVE",
    profileStatus: "PUBLISHED",
    autoRenew: true,
    periodStart: new Date("2026-08-29T12:00:00"),
    periodEnd: new Date("2026-09-29T12:00:00"),
    linksUsed: 57,
  };
}

export const initialAdminHistory: AdminHistoryItem[] = [
  {
    id: 1,
    date: "Aug 29, 2026",
    title: "Subscription created",
    description: "Premium Plus subscription activated.",
  },
  {
    id: 2,
    date: "Aug 29, 2026",
    title: "Account created",
    description: "Customer account was created by administrator.",
  },
];
