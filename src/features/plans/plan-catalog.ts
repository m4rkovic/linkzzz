export type PlanId = "BASIC" | "PRO" | "ENTERPRISE";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceUsdMonthly: number;
  smartLinkLimit: number;
  smartLinkDisplay: string;
  pageLinkLimit: number;
  description: string;
};

export const PLAN_CATALOG: Record<PlanId, PlanDefinition> = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    priceUsdMonthly: 40,
    smartLinkLimit: 50,
    smartLinkDisplay: "50",
    pageLinkLimit: 10,
    description: "A focused workspace for individual creators and small businesses.",
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceUsdMonthly: 80,
    smartLinkLimit: 100,
    smartLinkDisplay: "100",
    pageLinkLimit: 30,
    description: "More room for active campaigns, launches and multiple destinations.",
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceUsdMonthly: 150,
    // 200+ is the customer-facing promise. Keep a generous finite operational
    // guardrail until we introduce negotiated per-account limits.
    smartLinkLimit: 500,
    smartLinkDisplay: "200+",
    pageLinkLimit: 100,
    description: "High-volume Linkzzz usage with significantly larger working limits.",
  },
};

export const PLAN_ORDER: PlanId[] = ["BASIC", "PRO", "ENTERPRISE"];

export function getPlanDefinition(plan: PlanId) {
  return PLAN_CATALOG[plan];
}

export function getPlanName(plan: PlanId) {
  return getPlanDefinition(plan).name;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "BASIC" || value === "PRO" || value === "ENTERPRISE";
}
