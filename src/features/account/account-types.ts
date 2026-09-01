export type AccountPlan = "PREMIUM" | "PREMIUM_PLUS";

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
  return plan === "PREMIUM_PLUS" ? 100 : 40;
}
