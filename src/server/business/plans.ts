import {
  PLAN_CATALOG,
  type PlanId,
} from "@/features/plans/plan-catalog";

export type Plan = PlanId;

/** Stable error code shared by quota decisions, repositories, and API services. */
export const SMART_LINK_LIMIT_REASON = "SMART_LINK_LIMIT_REACHED" as const;
export type SmartLinkLimitReason = typeof SMART_LINK_LIMIT_REASON;

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

export type LinkLimitDecision = {
  allowed: boolean;
  limit: number;
  currentCount: number;
  reason?: SmartLinkLimitReason;
};

export type PageCardSaveDecision = {
  allowed: boolean;
  limit: number;
  previousCount: number;
  nextCount: number;
  overLimit: boolean;
  reason?: "PAGE_CARD_LIMIT_REACHED";
};

/**
 * Existing over-limit pages are grandfathered after a downgrade. They may be
 * edited or reduced without deleting customer data, but they may not grow
 * further until usage returns to the current plan limit.
 */
export function canSavePageCards(
  plan: Plan,
  previousCount: number,
  nextCount: number,
): PageCardSaveDecision {
  const normalizedPrevious = normalizeCount(previousCount);
  const normalizedNext = normalizeCount(nextCount);
  const limit = getPageCardLimit(plan);
  const overLimit = normalizedNext > limit;
  const growing = normalizedNext > normalizedPrevious;

  if (overLimit && growing) {
    return {
      allowed: false,
      limit,
      previousCount: normalizedPrevious,
      nextCount: normalizedNext,
      overLimit,
      reason: "PAGE_CARD_LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    limit,
    previousCount: normalizedPrevious,
    nextCount: normalizedNext,
    overLimit,
  };
}

function makeLimitDecision(
  limit: number,
  currentCount: number,
): LinkLimitDecision {
  const normalizedCount = normalizeCount(currentCount);

  if (normalizedCount >= limit) {
    return {
      allowed: false,
      limit,
      currentCount: normalizedCount,
      reason: SMART_LINK_LIMIT_REASON,
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

export function assessPageCardPlanChange(
  fromPlan: Plan,
  toPlan: Plan,
  currentCount: number,
): DowngradeAssessment {
  return makeDowngradeAssessment(
    fromPlan,
    toPlan,
    currentCount,
    getPageCardLimit(toPlan),
  );
}

export function assessSmartLinkPlanChange(
  fromPlan: Plan,
  toPlan: Plan,
  currentCount: number,
): DowngradeAssessment {
  return makeDowngradeAssessment(
    fromPlan,
    toPlan,
    currentCount,
    getSmartLinkLimit(toPlan),
  );
}

function makeDowngradeAssessment(
  fromPlan: Plan,
  toPlan: Plan,
  currentCount: number,
  newLimit: number,
): DowngradeAssessment {
  const normalizedCount = normalizeCount(currentCount);
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

function normalizeCount(value: number) {
  return Math.max(0, Math.trunc(value));
}
