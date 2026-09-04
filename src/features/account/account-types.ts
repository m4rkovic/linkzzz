import type { PlanId } from "@/features/plans/plan-catalog";
import type { SubscriptionStatus } from "@/server/business/subscriptions";

export type AccountPlan = PlanId;

export type AccountSummary = {
  username: string;
  email: string;
  plan: AccountPlan;
  subscriptionStatus: SubscriptionStatus;
  periodLabel: string;
  expiresLabel: string;
  autoRenew: boolean;
  smartLinksUsed: number;
};
