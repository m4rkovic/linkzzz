export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type SubscriptionAccessDecision = {
  hasAccess: boolean;
  reason?: "EXPIRED" | "STOPPED";
};

export function getSubscriptionAccess(
  status: SubscriptionStatus,
  expiresAt?: Date | null,
  now = new Date(),
): SubscriptionAccessDecision {
  if (status === "STOPPED") {
    return { hasAccess: false, reason: "STOPPED" };
  }

  if (status === "EXPIRED" || (expiresAt && expiresAt.getTime() <= now.getTime())) {
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
