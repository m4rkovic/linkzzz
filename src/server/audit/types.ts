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
  | "USER_DELETED"
  | "CUSTOM_DOMAIN_ADDED"
  | "CUSTOM_DOMAIN_VERIFIED"
  | "CUSTOM_DOMAIN_REMOVED";

export type AuditResourceType =
  | "USER"
  | "PROFILE"
  | "SUBSCRIPTION"
  | "SESSION"
  | "CUSTOM_DOMAIN";

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
