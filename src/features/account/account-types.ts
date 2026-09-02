import {
  getPlanDefinition,
  type PlanId,
} from "@/features/plans/plan-catalog";

export type AccountPlan = PlanId;

export type AccountSubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type AccountSummary = {
  displayName: string;
  username: string;
  email: string;
  slug: string;
  plan: AccountPlan;
  subscriptionStatus: AccountSubscriptionStatus;
  periodLabel: string;
  expiresLabel: string;
  autoRenew: boolean;
  linksUsed: number;
};

export function getAccountPlanLimit(plan: AccountPlan) {
  return getPlanDefinition(plan).smartLinkLimit;
}
