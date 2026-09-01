import type { AdminPlan, AdminSubscriptionStatus } from "@/features/admin/admin-types";

export function getPlanLimit(plan: AdminPlan) {
  return plan === "PREMIUM_PLUS" ? 100 : 40;
}

export function getSubscriptionLabel(status: AdminSubscriptionStatus) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "CANCEL_AT_PERIOD_END":
      return "Cancels at expiry";
    case "EXPIRED":
      return "Expired";
    case "STOPPED":
      return "Stopped";
  }
}

export function addMonthsClamped(sourceDate: Date, months: number) {
  const sourceDay = sourceDate.getDate();
  const target = new Date(sourceDate);

  target.setDate(1);
  target.setMonth(target.getMonth() + months);

  const lastDayOfTargetMonth = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();

  target.setDate(Math.min(sourceDay, lastDayOfTargetMonth));

  return target;
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
