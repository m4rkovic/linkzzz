import { hasScheduleWindow, resolveScheduleWindow, validateScheduleWindow } from "@/features/scheduling/schedule";
import type { LinkAvailability, PublicProfileLink } from "@/types/profile";

export type LinkAvailabilityState =
  | "ACTIVE"
  | "HIDDEN"
  | "UPCOMING"
  | "EXPIRED_HIDDEN"
  | "EXPIRED_DISABLED";

export function resolveLinkAvailability(
  link: Pick<PublicProfileLink, "visible" | "availability">,
  nowMs: number = Date.now(),
): LinkAvailabilityState {
  if (!link.visible) return "HIDDEN";

  const scheduleState = resolveScheduleWindow(link.availability, nowMs);
  if (scheduleState === "UPCOMING") return "UPCOMING";
  if (scheduleState === "ENDED") {
    return link.availability?.expiryAction === "DISABLE"
      ? "EXPIRED_DISABLED"
      : "EXPIRED_HIDDEN";
  }

  return "ACTIVE";
}

export function isLinkRendered(state: LinkAvailabilityState) {
  return state === "ACTIVE" || state === "EXPIRED_DISABLED";
}

export function isLinkNavigable(state: LinkAvailabilityState) {
  return state === "ACTIVE";
}

export function hasLinkSchedule(link: Pick<PublicProfileLink, "availability">) {
  return hasScheduleWindow(link.availability);
}

export function validateLinkAvailability(availability: LinkAvailability | undefined) {
  const scheduleError = validateScheduleWindow(availability);
  if (scheduleError) return scheduleError;
  if (
    availability?.expiryAction !== undefined &&
    availability.expiryAction !== "HIDE" &&
    availability.expiryAction !== "DISABLE"
  ) {
    return "Expiry behavior is invalid.";
  }
  return null;
}
