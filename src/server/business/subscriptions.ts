export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type SubscriptionAction =
  | "RENEW"
  | "STOP_RENEWAL"
  | "RESUME_RENEWAL"
  | "STOP_IMMEDIATELY"
  | "CHANGE_PLAN";

export type SubscriptionAccessDecision = {
  hasAccess: boolean;
  reason?: "EXPIRED" | "STOPPED";
};

export type SubscriptionTransitionDecision =
  | {
      allowed: true;
      effectiveStatus: SubscriptionStatus;
      nextStatus: SubscriptionStatus;
    }
  | {
      allowed: false;
      effectiveStatus: SubscriptionStatus;
      reason: "INVALID_TRANSITION";
    };

const ALLOWED_ACTIONS: Record<SubscriptionStatus, readonly SubscriptionAction[]> = {
  ACTIVE: ["RENEW", "STOP_RENEWAL", "STOP_IMMEDIATELY", "CHANGE_PLAN"],
  CANCEL_AT_PERIOD_END: [
    "RENEW",
    "RESUME_RENEWAL",
    "STOP_IMMEDIATELY",
    "CHANGE_PLAN",
  ],
  EXPIRED: ["RENEW", "CHANGE_PLAN"],
  STOPPED: ["RENEW", "CHANGE_PLAN"],
};

export function getEffectiveSubscriptionStatus(
  status: SubscriptionStatus,
  expiresAt?: Date | null,
  now = new Date(),
): SubscriptionStatus {
  if (status === "STOPPED") return "STOPPED";
  if (status === "EXPIRED") return "EXPIRED";
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return status;
}

export function getSubscriptionAccess(
  status: SubscriptionStatus,
  expiresAt?: Date | null,
  now = new Date(),
): SubscriptionAccessDecision {
  const effectiveStatus = getEffectiveSubscriptionStatus(status, expiresAt, now);

  if (effectiveStatus === "STOPPED") {
    return { hasAccess: false, reason: "STOPPED" };
  }

  if (effectiveStatus === "EXPIRED") {
    return { hasAccess: false, reason: "EXPIRED" };
  }

  return { hasAccess: true };
}

export function getSubscriptionTransition(
  status: SubscriptionStatus,
  expiresAt: Date | null | undefined,
  action: SubscriptionAction,
  now = new Date(),
): SubscriptionTransitionDecision {
  const effectiveStatus = getEffectiveSubscriptionStatus(status, expiresAt, now);
  if (!ALLOWED_ACTIONS[effectiveStatus].includes(action)) {
    return {
      allowed: false,
      effectiveStatus,
      reason: "INVALID_TRANSITION",
    };
  }

  return {
    allowed: true,
    effectiveStatus,
    nextStatus: resolveNextStatus(effectiveStatus, action),
  };
}

export function getAllowedSubscriptionActions(
  status: SubscriptionStatus,
  expiresAt?: Date | null,
  now = new Date(),
) {
  const effectiveStatus = getEffectiveSubscriptionStatus(status, expiresAt, now);
  return [...ALLOWED_ACTIONS[effectiveStatus]];
}

function resolveNextStatus(
  currentStatus: SubscriptionStatus,
  action: SubscriptionAction,
): SubscriptionStatus {
  switch (action) {
    case "RENEW":
    case "RESUME_RENEWAL":
      return "ACTIVE";
    case "STOP_RENEWAL":
      return "CANCEL_AT_PERIOD_END";
    case "STOP_IMMEDIATELY":
      return "STOPPED";
    case "CHANGE_PLAN":
      return currentStatus;
  }
}
