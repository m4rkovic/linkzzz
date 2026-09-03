const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_NOON_HOUR = 12;

/**
 * Subscription periods are date-based business values, not local wall-clock
 * timestamps. Persist them at UTC noon so the selected calendar date remains
 * stable across user/server time zones and DST changes.
 */
export function parseSubscriptionDateInput(value: string): Date | null {
  const match = DATE_INPUT_PATTERN.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day, UTC_NOON_HOUR));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== monthIndex ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatSubscriptionDateInput(date: Date) {
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
