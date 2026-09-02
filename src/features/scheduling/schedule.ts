import type { ScheduledVisibility } from "@/types/profile";

export type ScheduleWindowState = "ACTIVE" | "UPCOMING" | "ENDED";

export function resolveScheduleWindow(
  schedule: ScheduledVisibility | null | undefined,
  nowMs: number = Date.now(),
): ScheduleWindowState {
  // Client renderers intentionally start at 0 so SSR and hydration agree.
  // The clock switches to real time immediately after mount.
  if (nowMs <= 0 || !schedule) return "ACTIVE";

  const visibleFrom = timestamp(schedule.visibleFrom);
  const visibleUntil = timestamp(schedule.visibleUntil);

  if (visibleFrom !== null && nowMs < visibleFrom) return "UPCOMING";
  if (visibleUntil !== null && nowMs >= visibleUntil) return "ENDED";
  return "ACTIVE";
}

export function hasScheduleWindow(schedule: ScheduledVisibility | null | undefined) {
  return Boolean(schedule?.visibleFrom || schedule?.visibleUntil);
}

export function validateScheduleWindow(
  schedule: ScheduledVisibility | null | undefined,
): string | null {
  if (!schedule) return null;

  const visibleFrom = optionalTimestamp(schedule.visibleFrom);
  if (!visibleFrom.ok) return "Start time is invalid.";

  const visibleUntil = optionalTimestamp(schedule.visibleUntil);
  if (!visibleUntil.ok) return "End time is invalid.";

  if (
    visibleFrom.value !== null &&
    visibleUntil.value !== null &&
    visibleFrom.value >= visibleUntil.value
  ) {
    return "End time must be after the start time.";
  }

  return null;
}

export function toDateTimeLocalValue(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 64) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function timestamp(value: string | undefined) {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalTimestamp(value: string | undefined) {
  if (!value) return { ok: true as const, value: null };
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return { ok: false as const };
  return { ok: true as const, value: parsed };
}
