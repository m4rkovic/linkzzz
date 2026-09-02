import type { ProfileEngagement, ProfileVisitorMessaging } from "@/types/profile";

export const DEFAULT_VISITOR_MESSAGING: Required<ProfileVisitorMessaging> = {
  activeIndicator: "OFF",
  responseTime: "OFF",
  customResponseTime: "",
};

export function resolveVisitorMessaging(
  engagement: ProfileEngagement | null | undefined,
): Required<ProfileVisitorMessaging> {
  return {
    ...DEFAULT_VISITOR_MESSAGING,
    ...(engagement?.visitorMessaging ?? {}),
  };
}

export function resolveResponseTimeLabel(
  engagement: ProfileEngagement | null | undefined,
): string | null {
  const messaging = resolveVisitorMessaging(engagement);
  switch (messaging.responseTime) {
    case "TEN_MINUTES":
      return "Usually replies within 10 minutes";
    case "ONE_HOUR":
      return "Usually replies within 1 hour";
    case "CUSTOM": {
      const value = messaging.customResponseTime.trim();
      return value || null;
    }
    default:
      return null;
  }
}

export function hasVisitorMessaging(engagement: ProfileEngagement | null | undefined) {
  const messaging = resolveVisitorMessaging(engagement);
  return messaging.activeIndicator === "STATIC_ACTIVE" || Boolean(resolveResponseTimeLabel(engagement));
}
