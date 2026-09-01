export type Plan = "PREMIUM" | "PREMIUM_PLUS";

export const PLAN_LINK_LIMITS: Record<Plan, number> = {
  PREMIUM: 40,
  PREMIUM_PLUS: 100,
};

export function getPlanLinkLimit(plan: Plan) {
  return PLAN_LINK_LIMITS[plan];
}

export type LinkLimitDecision = {
  allowed: boolean;
  limit: number;
  currentCount: number;
  reason?: "LINK_LIMIT_REACHED";
};

export function canCreateLink(plan: Plan, currentCount: number): LinkLimitDecision {
  const normalizedCount = Math.max(0, Math.trunc(currentCount));
  const limit = getPlanLinkLimit(plan);

  if (normalizedCount >= limit) {
    return {
      allowed: false,
      limit,
      currentCount: normalizedCount,
      reason: "LINK_LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    limit,
    currentCount: normalizedCount,
  };
}

export type DowngradeAssessment = {
  fromPlan: Plan;
  toPlan: Plan;
  currentCount: number;
  newLimit: number;
  exceedsNewLimit: boolean;
  linksToRemoveBeforeAddingNew: number;
};

export function assessPlanChange(
  fromPlan: Plan,
  toPlan: Plan,
  currentCount: number,
): DowngradeAssessment {
  const normalizedCount = Math.max(0, Math.trunc(currentCount));
  const newLimit = getPlanLinkLimit(toPlan);
  const exceedsNewLimit = normalizedCount > newLimit;

  return {
    fromPlan,
    toPlan,
    currentCount: normalizedCount,
    newLimit,
    exceedsNewLimit,
    linksToRemoveBeforeAddingNew: exceedsNewLimit
      ? normalizedCount - newLimit
      : 0,
  };
}
