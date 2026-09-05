import { getPlanDefinition } from "@/features/plans/plan-catalog";
import type { AdminPlan, AdminSubscriptionStatus } from "@/features/admin/admin-types";

export function getPlanLimit(plan: AdminPlan) {
  return getPlanDefinition(plan).smartLinkLimit;
}

export function getPlanUsageLabel(plan: AdminPlan, used: number) {
  return `${used} / ${getPlanDefinition(plan).smartLinkDisplay}`;
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

export function getDaysUntil(date: Date, now = new Date()) {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

export function getExpiryLabel(date: Date, now = new Date()) {
  const days = getDaysUntil(date, now);
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} days`;
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
