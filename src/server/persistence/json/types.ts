import type { AuditAction, AuditResourceType } from "@/server/audit/types";
import type { Plan } from "@/server/business/plans";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import type { AccountStatus, UserRole } from "@/server/types/auth";
import type { PersistedProfileData } from "@/types/persisted-profile";

export type StoredUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type StoredPasswordCredential = {
  userId: string;
  passwordHash: string;
  mustChangePassword: boolean;
  updatedAt: string;
};

export type StoredSubscription = {
  id: string;
  userId: string;
  plan: Plan;
  status: SubscriptionStatus;
  startedAt?: string;
  expiresAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StoredSession = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
};

export type StoredAuditEvent = {
  id: string;
  timestamp: string;
  actorUserId: string;
  targetUserId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type StoredProfile = {
  userId: string;
  profile: PersistedProfileData;
  revision?: number;
  createdAt: string;
  updatedAt: string;
};
