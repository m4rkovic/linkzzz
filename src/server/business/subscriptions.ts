export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type SubscriptionAccessDecision = {
  hasAccess: boolean;
  reason?: "EXPIRED" | "STOPPED";
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

export function stopRenewal(): SubscriptionStatus {
  return "CANCEL_AT_PERIOD_END";
}

export function resumeSubscription(): SubscriptionStatus {
  return "ACTIVE";
}

export function stopSubscriptionImmediately(): SubscriptionStatus {
  return "STOPPED";
}
