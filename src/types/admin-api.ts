import type { AccountStatus } from "@/server/types/auth";
import type { Plan } from "@/server/business/plans";
import type {
  SubscriptionMutation,
  SubscriptionStatus,
} from "@/server/business/subscriptions";
import type { SmartLinkStatus, SmartLinkType } from "@/types/smart-link";

export type AdminSmartLinkSnapshot = {
  id: string;
  title: string;
  slug: string;
  type: SmartLinkType;
  status: SmartLinkStatus;
  updatedAt: string;
};

export type AdminUserSnapshot = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  initials: string;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  accountStatus: AccountStatus;
  autoRenew: boolean;
  periodStart: string;
  periodEnd: string;
  smartLinksUsed: number;
  smartLinks: AdminSmartLinkSnapshot[];
};

export type AdminHistorySnapshot = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type AdminUserListItem = Omit<AdminUserSnapshot, "smartLinks"> & {
  publishedLinks: number;
  draftLinks: number;
  disabledLinks: number;
};

export type AdminUserAction =
  | SubscriptionMutation
  | { type: "SET_SMART_LINK_STATUS"; smartLinkId: string; status: "PUBLISHED" | "DISABLED" }
  | { type: "SUSPEND"; reason?: string }
  | { type: "REACTIVATE" }
  | { type: "RESET_PASSWORD" };
