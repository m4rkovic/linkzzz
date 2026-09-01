export type AdminPlan = "PREMIUM" | "PREMIUM_PLUS";

export type AdminSubscriptionStatus =
  | "ACTIVE"
  | "CANCEL_AT_PERIOD_END"
  | "EXPIRED"
  | "STOPPED";

export type AdminAccountStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

export type AdminProfileStatus = "PUBLISHED" | "DRAFT" | "DISABLED";

export type AdminHistoryItem = {
  id: string | number;
  date: string;
  title: string;
  description: string;
};

export type AdminUserModel = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  slug: string;
  initials: string;
  plan: AdminPlan;
  subscriptionStatus: AdminSubscriptionStatus;
  accountStatus: AdminAccountStatus;
  profileStatus: AdminProfileStatus;
  autoRenew: boolean;
  periodStart: Date;
  periodEnd: Date;
  linksUsed: number;
};
