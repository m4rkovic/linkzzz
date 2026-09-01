import type { AccountStatus } from "@/server/types/auth";
import type { Plan } from "@/server/business/plans";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import type { ProfileStatus } from "@/types/profile";

export type AdminUserSnapshot = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  slug: string;
  initials: string;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  accountStatus: AccountStatus;
  profileStatus: ProfileStatus;
  autoRenew: boolean;
  periodStart: string;
  periodEnd: string;
  linksUsed: number;
};

export type AdminHistorySnapshot = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type AdminUserListItem = AdminUserSnapshot;

export type AdminUserAction =
  | { type: "RENEW"; months: 1 | 3 | 6 | 12 }
  | { type: "STOP_RENEWAL" }
  | { type: "RESUME_RENEWAL" }
  | { type: "STOP_IMMEDIATELY" }
  | { type: "CHANGE_PLAN"; plan: Plan }
  | { type: "SET_PROFILE_STATUS"; status: "PUBLISHED" | "DISABLED" }
  | { type: "CHANGE_SLUG"; slug: string }
  | { type: "SUSPEND"; reason?: string }
  | { type: "REACTIVATE" }
  | { type: "RESET_PASSWORD" };
