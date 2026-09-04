import type { PlanId } from "@/features/plans/plan-catalog";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import type { AccountStatus } from "@/server/types/auth";
import type { SmartLinkStatus, SmartLinkType } from "@/types/smart-link";

export type AdminPlan = PlanId;
export type AdminSubscriptionStatus = SubscriptionStatus;
export type AdminAccountStatus = AccountStatus;

export type AdminHistoryItem = {
  id: string | number;
  date: string;
  title: string;
  description: string;
};

export type AdminSmartLinkModel = {
  id: string;
  title: string;
  slug: string;
  type: SmartLinkType;
  status: SmartLinkStatus;
  updatedAt: Date;
};

export type AdminUserModel = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  initials: string;
  plan: AdminPlan;
  subscriptionStatus: AdminSubscriptionStatus;
  accountStatus: AdminAccountStatus;
  autoRenew: boolean;
  periodStart: Date;
  periodEnd: Date;
  smartLinksUsed: number;
  smartLinks: AdminSmartLinkModel[];
};
