export type AuditAction =
  | "LOGIN_SUCCEEDED"
  | "LOGOUT"
  | "USER_CREATED"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "PLAN_CHANGED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_STOP_RENEWAL"
  | "SUBSCRIPTION_RESUMED"
  | "SUBSCRIPTION_STOPPED"
  | "USER_SUSPENDED"
  | "USER_REACTIVATED"
  | "USER_DISABLED"
  | "PROFILE_ENABLED"
  | "PROFILE_DISABLED"
  | "PROFILE_UPDATED"
  | "PROFILE_PUBLISHED"
  | "PROFILE_UNPUBLISHED"
  | "SLUG_CHANGED"
  | "SMART_LINK_UPDATED"
  | "SMART_LINK_PUBLISHED"
  | "SMART_LINK_UNPUBLISHED"
  | "SMART_LINK_SLUG_CHANGED"
  | "USER_DELETED"
  | "CUSTOM_DOMAIN_ADDED"
  | "CUSTOM_DOMAIN_RECLAIMED"
  | "CUSTOM_DOMAIN_VERIFIED"
  | "CUSTOM_DOMAIN_ACTIVATED"
  | "CUSTOM_DOMAIN_DISABLED"
  | "SMART_LINK_DUPLICATED"
  | "SMART_LINK_DELETED"
  | "SMART_LINK_DISABLED"
  | "SMART_LINK_ENABLED"
  | "CUSTOM_DOMAIN_REMOVED"
  | "CUSTOM_DOMAIN_RELEASED"
  | "ASSET_ORPHAN_SWEEP";

export type AuditResourceType =
  | "USER"
  | "PROFILE"
  | "SUBSCRIPTION"
  | "SESSION"
  | "SMART_LINK"
  | "CUSTOM_DOMAIN"
  | "ASSET";

export type AuditEventInput = {
  actorUserId: string;
  targetUserId?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type AuditEventRecord = AuditEventInput & {
  id: string;
  timestamp: string;
};

export interface AuditWriter {
  write(event: AuditEventInput): Promise<void>;
}
