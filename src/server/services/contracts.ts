import type { AuditWriter } from "@/server/audit/types";
import type { Plan } from "@/server/business/plans";
import type {
  SubscriptionMutation,
  SubscriptionStatus,
} from "@/server/business/subscriptions";
import type { SmartLinkModerationMutation } from "@/server/smart-links/smart-link-lifecycle";
import type { AccountStatus, UserRole } from "@/server/types/auth";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type { AnalyticsDashboardData } from "@/types/analytics";
import type { SmartLinkEditableData, SmartLinkRecord } from "@/types/smart-link";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
};

export type SubscriptionRecord = {
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date | null;
  autoRenew: boolean;
};

export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByLogin(login: string): Promise<UserRecord | null>;
  list(): Promise<UserRecord[]>;
  create(input: {
    username: string;
    email: string;
    role: UserRole;
    accountStatus: AccountStatus;
  }): Promise<UserRecord>;
  update(
    id: string,
    patch: Partial<Pick<UserRecord, "username" | "email" | "role" | "accountStatus">>,
  ): Promise<UserRecord | null>;
}

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<SubscriptionRecord | null>;
  upsert(record: SubscriptionRecord): Promise<SubscriptionRecord>;
}

export interface AdminSubscriptionMutationRepository {
  apply(
    actorUserId: string,
    userId: string,
    action: SubscriptionMutation,
  ): Promise<void>;
}

export type AdminAccountMutation =
  | { type: "SUSPEND"; reason?: string }
  | { type: "REACTIVATE" }
  | { type: "RESET_PASSWORD"; passwordHash: string };

export interface AdminAccountMutationRepository {
  apply(
    actorUserId: string,
    userId: string,
    action: AdminAccountMutation,
  ): Promise<void>;
}

export interface AdminSmartLinkMutationRepository {
  apply(
    actorUserId: string,
    userId: string,
    action: SmartLinkModerationMutation,
  ): Promise<void>;
}

export type AdminCustomerReadRecord = {
  user: UserRecord;
  displayName: string;
  subscription: SubscriptionRecord;
  smartLinks: Array<
    Pick<
      SmartLinkRecord,
      "id" | "title" | "slug" | "type" | "status" | "updatedAt"
    >
  >;
};

export interface AdminReadRepository {
  listCustomers(): Promise<AdminCustomerReadRecord[]>;
}

export interface ProfileRepository {
  findVersionedBySmartLinkIdForUser(
    smartLinkId: string,
    userId: string,
  ): Promise<VersionedProfileRecord | null>;
  updateForSmartLinkIfRevision(
    smartLinkId: string,
    userId: string,
    profile: PersistedProfileData,
    expectedRevision: number,
  ): Promise<ConditionalProfileWriteResult>;
}

export type CreateSmartLinkRecord = Omit<
  SmartLinkRecord,
  "id" | "revision" | "createdAt" | "updatedAt"
>;

export type ConditionalSmartLinkWriteResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | { ok: false; reason: "REVISION_CONFLICT" };

type SmartLinkQuotaRejection =
  | { ok: false; reason: "SUBSCRIPTION_INACTIVE" }
  | { ok: false; reason: "LIMIT_REACHED"; plan: Plan; limit: number };

export type CreateSmartLinkWithinLimitResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | SmartLinkQuotaRejection;

export type DuplicateSmartLinkWithinLimitResult =
  | { ok: true; smartLink: SmartLinkRecord }
  | SmartLinkQuotaRejection
  | { ok: false; reason: "NOT_FOUND" | "SMART_LINK_DISABLED" };

export interface SmartLinkRepository {
  listForUser(userId: string): Promise<SmartLinkRecord[]>;
  countForUser(userId: string): Promise<number>;
  findByIdForUser(id: string, userId: string): Promise<SmartLinkRecord | null>;
  findBySlug(slug: string): Promise<SmartLinkRecord | null>;
  createWithinLimit(record: CreateSmartLinkRecord): Promise<CreateSmartLinkWithinLimitResult>;
  updateIfRevision(
    id: string,
    userId: string,
    editable: SmartLinkEditableData,
    expectedRevision: number,
  ): Promise<ConditionalSmartLinkWriteResult>;
  duplicateForUserWithinLimit(
    id: string,
    userId: string,
    title: string,
    slug: string,
  ): Promise<DuplicateSmartLinkWithinLimitResult>;
}

export type VersionedProfileRecord = {
  profile: PersistedProfileData;
  revision: number;
};

export type ConditionalProfileWriteResult =
  | ({ ok: true } & VersionedProfileRecord)
  | { ok: false; reason: "REVISION_CONFLICT" };

export interface PasswordCredentialRepository {
  getPasswordHash(userId: string): Promise<string | null>;
  setPasswordHash(userId: string, passwordHash: string): Promise<void>;
  getMustChangePassword(userId: string): Promise<boolean>;
  setMustChangePassword(userId: string, value: boolean): Promise<void>;
}

export interface SessionRepository {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;

  findValidByTokenHash(tokenHash: string, now: Date): Promise<{
    id: string;
    userId: string;
    expiresAt: Date;
  } | null>;

  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(now: Date): Promise<number>;
}

export type SubscriptionHistoryRecord = SubscriptionRecord & {
  id: string;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
};

export interface SubscriptionHistoryRepository {
  listForUser(userId: string): Promise<SubscriptionHistoryRecord[]>;
}

export type AnalyticsEventRecord = {
  id?: string;
  smartLinkId: string;
  pageCardId?: string | null;
  type:
    | "PAGE_VIEW"
    | "LINK_CLICK"
    | "SOCIAL_CLICK"
    | "SMART_LINK_VIEW"
    | "DEEPLINK_ATTEMPT"
    | "DEEPLINK_FALLBACK"
    | "BLOCKED_AUTOMATED_REQUEST";
  visitorId?: string | null;
  referrer?: string | null;
  countryCode?: string | null;
  countryName?: string | null;
  city?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  isBot?: boolean;
  createdAt?: Date;
};

export type AnalyticsSmartLinkRecord = Pick<
  SmartLinkRecord,
  "id" | "title" | "slug" | "type" | "status"
> & {
  pageCards: Array<{
    id: string;
    title: string;
    url: string;
  }>;
};

export type AnalyticsDashboardSummary = {
  links: Array<{
    smartLinkId: string;
    smartViews: number;
    legacyViews: number;
    clicks: number;
  }>;
  uniqueVisitors: number;
};

export interface AnalyticsRepository {
  create(event: AnalyticsEventRecord): Promise<AnalyticsEventRecord>;
  createForSlug(
    slug: string,
    event: Omit<AnalyticsEventRecord, "smartLinkId">,
  ): Promise<boolean>;
  summarizeDashboard(userId: string): Promise<AnalyticsDashboardSummary>;
  getDashboardData(
    userId: string,
    scopeSmartLinkId?: string,
  ): Promise<AnalyticsDashboardData | null>;
}

export type LeadSubmissionRecord = {
  id?: string;
  smartLinkId: string;
  blockId: string;
  email: string;
  createdAt?: Date;
};

export interface LeadSubmissionRepository {
  create(record: LeadSubmissionRecord): Promise<LeadSubmissionRecord>;
  listForSmartLink(smartLinkId: string): Promise<LeadSubmissionRecord[]>;
}

export type AssetRecord = {
  id?: string;
  smartLinkId: string;
  type: "AVATAR" | "COVER" | "LINK_IMAGE";
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
};

export interface AssetRepository {
  findById(id: string): Promise<AssetRecord | null>;
  findByIdsForSmartLink(
    userId: string,
    smartLinkId: string,
    ids: string[],
  ): Promise<AssetRecord[]>;
  create(asset: AssetRecord): Promise<AssetRecord>;
  createForSmartLink(
    userId: string,
    smartLinkId: string,
    asset: Omit<AssetRecord, "smartLinkId">,
  ): Promise<AssetRecord>;
  delete(id: string): Promise<void>;
  deleteUnusedForSmartLink(
    userId: string,
    smartLinkId: string,
    ids: string[],
  ): Promise<AssetRecord[]>;
}

export type CustomDomainRecord = {
  id?: string;
  smartLinkId: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "DISABLED";
  verificationToken: string;
  verifiedAt?: Date | null;
};

export interface CustomDomainRepository {
  findByDomain(domain: string): Promise<CustomDomainRecord | null>;
  findActiveSlugByDomain(domain: string): Promise<string | null>;
  listForUser(userId: string): Promise<CustomDomainRecord[]>;
  listForSmartLink(userId: string, smartLinkId: string): Promise<CustomDomainRecord[]>;
  createForSmartLink(userId: string, smartLinkId: string, domain: string, verificationToken: string): Promise<CustomDomainRecord>;
  upsert(record: CustomDomainRecord): Promise<CustomDomainRecord>;
  setStatusForSmartLink(userId: string, smartLinkId: string, domain: string, status: CustomDomainRecord["status"], verifiedAt?: Date | null): Promise<CustomDomainRecord | null>;
  deleteForSmartLink(userId: string, smartLinkId: string, domain: string): Promise<boolean>;
}

export type ProvisionCustomerInput = {
  actorUserId: string;
  username: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  subscription: Omit<SubscriptionRecord, "userId">;
  profile: PersistedProfileData;
};

export interface CustomerProvisioningRepository {
  create(input: ProvisionCustomerInput): Promise<UserRecord>;
}

export type ServerDependencies = {
  adminRead: AdminReadRepository;
  adminSubscriptions: AdminSubscriptionMutationRepository;
  adminAccounts: AdminAccountMutationRepository;
  adminSmartLinks: AdminSmartLinkMutationRepository;
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  smartLinks: SmartLinkRepository;
  profiles: ProfileRepository;
  passwords: PasswordCredentialRepository;
  sessions: SessionRepository;
  audit: AuditWriter & { listForUser(userId: string): Promise<import("@/server/audit/types").AuditEventRecord[]> };
  subscriptionHistory?: SubscriptionHistoryRepository;
  analytics?: AnalyticsRepository;
  leadSubmissions?: LeadSubmissionRepository;
  assets?: AssetRepository;
  customDomains?: CustomDomainRepository;
  customerProvisioning: CustomerProvisioningRepository;
};
