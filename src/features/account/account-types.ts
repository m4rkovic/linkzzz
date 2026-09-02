import type { PlanId } from "@/features/plans/plan-catalog";

export type AccountPlan = PlanId;

export type AccountSubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type AccountSummary = {
  username: string;
  email: string;
  plan: AccountPlan;
  subscriptionStatus: AccountSubscriptionStatus;
  periodLabel: string;
  expiresLabel: string;
  autoRenew: boolean;
  linksUsed: number;
};
