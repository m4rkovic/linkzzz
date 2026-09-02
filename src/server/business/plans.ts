import {
  PLAN_CATALOG,
  type PlanId,
} from "@/features/plans/plan-catalog";

export type Plan = PlanId;

export const SMART_LINK_LIMITS: Record<Plan, number> = {
  BASIC: PLAN_CATALOG.BASIC.smartLinkLimit,
  PRO: PLAN_CATALOG.PRO.smartLinkLimit,
  ENTERPRISE: PLAN_CATALOG.ENTERPRISE.smartLinkLimit,
};

export const PAGE_CARD_LIMITS: Record<Plan, number> = {
  BASIC: PLAN_CATALOG.BASIC.pageLinkLimit,
  PRO: PLAN_CATALOG.PRO.pageLinkLimit,
  ENTERPRISE: PLAN_CATALOG.ENTERPRISE.pageLinkLimit,
};

export function getSmartLinkLimit(plan: Plan) {
  return SMART_LINK_LIMITS[plan];
}

export function canCreateSmartLink(
  plan: Plan,
  currentCount: number,
): LinkLimitDecision {
  return makeLimitDecision(getSmartLinkLimit(plan), currentCount);
}

export function getPageCardLimit(plan: Plan) {
  return PAGE_CARD_LIMITS[plan];
}

/** @deprecated Use getPageCardLimit for page-card limits. */
export function getPlanLinkLimit(plan: Plan) {
  return getPageCardLimit(plan);
}

export type LinkLimitDecision = {
  allowed: boolean;
  limit: number;
  currentCount: number;
  reason?: "LINK_LIMIT_REACHED";
};

export function canCreateLink(plan: Plan, currentCount: number): LinkLimitDecision {
  return makeLimitDecision(getPageCardLimit(plan), currentCount);
}

function makeLimitDecision(
  limit: number,
  currentCount: number,
): LinkLimitDecision {
  const normalizedCount = Math.max(0, Math.trunc(currentCount));

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
  const newLimit = getPageCardLimit(toPlan);
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

export function assessSmartLinkPlanChange(
  fromPlan: Plan,
  toPlan: Plan,
  currentCount: number,
): DowngradeAssessment {
  const normalizedCount = Math.max(0, Math.trunc(currentCount));
  const newLimit = getSmartLinkLimit(toPlan);
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
