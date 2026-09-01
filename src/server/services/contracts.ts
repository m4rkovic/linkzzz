import type { AuditWriter } from "@/server/audit/types";
import type { Plan } from "@/server/business/plans";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import type { AccountStatus, UserRole } from "@/server/types/auth";
import type { PersistedProfileData } from "@/types/persisted-profile";

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


export interface ProfileRepository {
  findByUserId(userId: string): Promise<PersistedProfileData | null>;
  findVersionedByUserId(userId: string): Promise<VersionedProfileRecord | null>;
  findBySlug(slug: string): Promise<{ userId: string; profile: PersistedProfileData } | null>;
  upsert(userId: string, profile: PersistedProfileData): Promise<PersistedProfileData>;
  updateIfRevision(
    userId: string,
    profile: PersistedProfileData,
    expectedRevision: number,
  ): Promise<ConditionalProfileWriteResult>;
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
  profileId: string;
  linkId?: string | null;
  type: "PAGE_VIEW" | "LINK_CLICK" | "SOCIAL_CLICK";
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

export interface AnalyticsRepository {
  create(event: AnalyticsEventRecord): Promise<AnalyticsEventRecord>;
  createForSlug(
    slug: string,
    event: Omit<AnalyticsEventRecord, "profileId">,
  ): Promise<boolean>;
  listForUser(userId: string): Promise<AnalyticsEventRecord[]>;
  listForProfile(profileId: string, from?: Date): Promise<AnalyticsEventRecord[]>;
}

export type AssetRecord = {
  id?: string;
  profileId: string;
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
  findByIdsForUser(userId: string, ids: string[]): Promise<AssetRecord[]>;
  create(asset: AssetRecord): Promise<AssetRecord>;
  createForUser(userId: string, asset: Omit<AssetRecord, "profileId">): Promise<AssetRecord>;
  delete(id: string): Promise<void>;
  deleteUnusedForUser(userId: string, ids: string[]): Promise<AssetRecord[]>;
}

export type CustomDomainRecord = {
  id?: string;
  profileId: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "DISABLED";
  verificationToken: string;
  verifiedAt?: Date | null;
};

export interface CustomDomainRepository {
  findByDomain(domain: string): Promise<CustomDomainRecord | null>;
  findActiveSlugByDomain(domain: string): Promise<string | null>;
  listForUser(userId: string): Promise<CustomDomainRecord[]>;
  createForUser(userId: string, domain: string, verificationToken: string): Promise<CustomDomainRecord>;
  upsert(record: CustomDomainRecord): Promise<CustomDomainRecord>;
  setStatusForUser(userId: string, domain: string, status: CustomDomainRecord["status"], verifiedAt?: Date | null): Promise<CustomDomainRecord | null>;
  deleteForUser(userId: string, domain: string): Promise<boolean>;
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
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  profiles: ProfileRepository;
  passwords: PasswordCredentialRepository;
  sessions: SessionRepository;
  audit: AuditWriter & { listForUser(userId: string): Promise<import("@/server/audit/types").AuditEventRecord[]> };
  subscriptionHistory?: SubscriptionHistoryRepository;
  analytics?: AnalyticsRepository;
  assets?: AssetRepository;
  customDomains?: CustomDomainRepository;
  customerProvisioning: CustomerProvisioningRepository;
};
