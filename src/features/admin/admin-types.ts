import type { PlanId } from "@/features/plans/plan-catalog";
import type { SmartLinkStatus, SmartLinkType } from "@/types/smart-link";

export type AdminPlan = PlanId;

export type AdminSubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type AdminAccountStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

export type AdminHistoryItem = {
  id: string | number;
  date: string;
  title: string;
  slug: string;
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
  linksUsed: number;
  smartLinks: AdminSmartLinkModel[];
};
