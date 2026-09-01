import "server-only";

import { randomInt } from "node:crypto";
import { defaultAppearance } from "@/config/profile-defaults";
import type { AuditAction, AuditResourceType } from "@/server/audit/types";
import { passwordHasher } from "@/server/auth/password-hasher";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import { assessPlanChange, type Plan } from "@/server/business/plans";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { validateSlug } from "@/server/validation/slug";
import { validatePassword } from "@/server/validation/password";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type {
  AdminHistorySnapshot,
  AdminUserAction,
  AdminUserListItem,
  AdminUserSnapshot,
} from "@/types/admin-api";

export type CreateAdminUserInput = {
  displayName: string;
  username: string;
  email: string;
  slug: string;
  password: string;
  plan: Plan;
  periodStart: string;
  periodEnd: string;
  autoRenew: boolean;
  mustChangePassword: boolean;
};

export type AdminActionResult = {
  user: AdminUserSnapshot;
  history: AdminHistorySnapshot[];
  temporaryPassword?: string;
};

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const dependencies = await getServerDependencies();
  const users = await dependencies.users.list();
  const customers = users.filter((user) => user.role === "CUSTOMER");

  return Promise.all(customers.map((user) => buildAdminUserSnapshot(user.id)));
}

export async function getAdminUser(userId: string): Promise<AdminActionResult | null> {
  const dependencies = await getServerDependencies();
  const user = await dependencies.users.findById(userId);
  if (!user || user.role !== "CUSTOMER") return null;

  return {
    user: await buildAdminUserSnapshot(userId),
    history: await buildAdminHistory(userId),
  };
}

export async function createAdminUser(
  admin: AuthenticatedSession,
  input: CreateAdminUserInput,
): Promise<AdminActionResult> {
  const usernameValidation = validateSlug(input.username);
  if (!usernameValidation.ok) throw new Error(usernameValidation.error);

  const slugValidation = validateSlug(input.slug);
  if (!slugValidation.ok) throw new Error(slugValidation.error);

  const passwordValidation = validatePassword(input.password);
  if (!passwordValidation.ok) throw new Error(passwordValidation.error);

  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  const periodStart = parseDate(input.periodStart, "Invalid subscription start date.");
  const periodEnd = parseDate(input.periodEnd, "Invalid subscription expiry date.");
  if (periodEnd <= periodStart) throw new Error("Subscription expiry must be after the start date.");

  const dependencies = await getServerDependencies();
  const existingSlug = await dependencies.profiles.findBySlug(slugValidation.value);
  if (existingSlug) throw new Error("Profile slug already exists.");

  const passwordHash = await passwordHasher.hash(input.password);
  const profile: PersistedProfileData = {
    slug: slugValidation.value,
    displayName: input.displayName.trim() || usernameValidation.value,
    username: usernameValidation.value,
    bio: "",
    status: "DRAFT",
    stats: [],
    socials: [],
    links: [],
    appearance: structuredClone(defaultAppearance),
  };
  const user = await dependencies.customerProvisioning.create({
    actorUserId: admin.user.id,
    username: usernameValidation.value,
    email,
    passwordHash,
    mustChangePassword: input.mustChangePassword,
    subscription: {
      plan: input.plan,
      status: "ACTIVE",
      startedAt: periodStart,
      expiresAt: periodEnd,
      autoRenew: input.autoRenew,
    },
    profile,
  });

  return (await getAdminUser(user.id))!;
}

export async function performAdminUserAction(
  admin: AuthenticatedSession,
  userId: string,
  action: AdminUserAction,
): Promise<AdminActionResult> {
  const dependencies = await getServerDependencies();
  const user = await dependencies.users.findById(userId);
  if (!user || user.role !== "CUSTOMER") throw new Error("Customer not found.");

  const subscription = await dependencies.subscriptions.findByUserId(userId);
  const profile = await dependencies.profiles.findByUserId(userId);
  if (!subscription || !profile) throw new Error("Customer data is incomplete.");

  let temporaryPassword: string | undefined;

  switch (action.type) {
    case "RENEW": {
      const now = new Date();
      const restarting = subscription.status === "EXPIRED" || subscription.status === "STOPPED";
      const base = restarting || !subscription.expiresAt || subscription.expiresAt < now
        ? now
        : subscription.expiresAt;
      const startedAt = restarting ? now : subscription.startedAt;
      const expiresAt = addMonthsClamped(base, action.months);

      await dependencies.subscriptions.upsert({
        ...subscription,
        status: "ACTIVE",
        startedAt,
        expiresAt,
      });

      if (user.accountStatus === "DISABLED") {
        await dependencies.users.update(userId, { accountStatus: "ACTIVE" });
      }

      await writeAudit(admin.user.id, userId, "SUBSCRIPTION_RENEWED", "SUBSCRIPTION", {
        months: action.months,
        expiresAt: expiresAt.toISOString(),
      });
      break;
    }

    case "STOP_RENEWAL":
      await dependencies.subscriptions.upsert({
        ...subscription,
        status: "CANCEL_AT_PERIOD_END",
        autoRenew: false,
      });
      await writeAudit(admin.user.id, userId, "SUBSCRIPTION_STOP_RENEWAL", "SUBSCRIPTION");
      break;

    case "RESUME_RENEWAL":
      await dependencies.subscriptions.upsert({
        ...subscription,
        status: "ACTIVE",
        autoRenew: true,
      });
      await writeAudit(admin.user.id, userId, "SUBSCRIPTION_RESUMED", "SUBSCRIPTION");
      break;

    case "STOP_IMMEDIATELY":
      await dependencies.subscriptions.upsert({
        ...subscription,
        status: "STOPPED",
        autoRenew: false,
      });
      await dependencies.users.update(userId, { accountStatus: "DISABLED" });
      await dependencies.profiles.upsert(userId, { ...profile, status: "DISABLED" });
      await dependencies.sessions.revokeAllForUser(userId);
      await writeAudit(admin.user.id, userId, "SUBSCRIPTION_STOPPED", "SUBSCRIPTION");
      break;

    case "CHANGE_PLAN": {
      const assessment = assessPlanChange(subscription.plan, action.plan, profile.links.length);
      await dependencies.subscriptions.upsert({ ...subscription, plan: action.plan });
      await writeAudit(admin.user.id, userId, "PLAN_CHANGED", "SUBSCRIPTION", {
        previousPlan: subscription.plan,
        nextPlan: action.plan,
        overNewLimit: assessment.exceedsNewLimit,
      });
      break;
    }

    case "SET_PROFILE_STATUS":
      await dependencies.profiles.upsert(userId, { ...profile, status: action.status });
      await writeAudit(
        admin.user.id,
        userId,
        action.status === "DISABLED" ? "PROFILE_DISABLED" : "PROFILE_ENABLED",
        "PROFILE",
      );
      break;

    case "CHANGE_SLUG": {
      const validation = validateSlug(action.slug);
      if (!validation.ok) throw new Error(validation.error);
      const owner = await dependencies.profiles.findBySlug(validation.value);
      if (owner && owner.userId !== userId) throw new Error("Profile slug already exists.");
      const previousSlug = profile.slug;
      await dependencies.profiles.upsert(userId, { ...profile, slug: validation.value });
      await writeAudit(admin.user.id, userId, "SLUG_CHANGED", "PROFILE", {
        previousSlug,
        nextSlug: validation.value,
      });
      break;
    }

    case "SUSPEND":
      await dependencies.users.update(userId, { accountStatus: "SUSPENDED" });
      await dependencies.profiles.upsert(userId, { ...profile, status: "DISABLED" });
      await dependencies.sessions.revokeAllForUser(userId);
      await writeAudit(admin.user.id, userId, "USER_SUSPENDED", "USER", {
        reason: action.reason?.trim() || null,
      });
      break;

    case "REACTIVATE":
      await dependencies.users.update(userId, { accountStatus: "ACTIVE" });
      await writeAudit(admin.user.id, userId, "USER_REACTIVATED", "USER");
      break;

    case "RESET_PASSWORD":
      temporaryPassword = generateTemporaryPassword();
      await dependencies.passwords.setPasswordHash(
        userId,
        await passwordHasher.hash(temporaryPassword),
      );
      await dependencies.passwords.setMustChangePassword(userId, true);
      await dependencies.sessions.revokeAllForUser(userId);
      await writeAudit(admin.user.id, userId, "PASSWORD_RESET", "USER");
      break;
  }

  const result = (await getAdminUser(userId))!;
  return temporaryPassword ? { ...result, temporaryPassword } : result;
}

async function buildAdminUserSnapshot(userId: string): Promise<AdminUserSnapshot> {
  const dependencies = await getServerDependencies();
  const user = await dependencies.users.findById(userId);
  const subscription = await dependencies.subscriptions.findByUserId(userId);
  const profile = await dependencies.profiles.findByUserId(userId);
  if (!user || !subscription || !profile) throw new Error("Customer data is incomplete.");

  return {
    id: user.id,
    displayName: profile.displayName || user.username,
    username: user.username,
    email: user.email,
    slug: profile.slug,
    initials: createInitials(profile.displayName || user.username),
    plan: subscription.plan,
    subscriptionStatus: normalizeExpiredStatus(subscription.status, subscription.expiresAt),
    accountStatus: user.accountStatus,
    profileStatus: profile.status,
    autoRenew: subscription.autoRenew,
    periodStart: subscription.startedAt.toISOString(),
    periodEnd: (subscription.expiresAt ?? subscription.startedAt).toISOString(),
    linksUsed: profile.links.length,
  };
}

async function buildAdminHistory(userId: string): Promise<AdminHistorySnapshot[]> {
  const dependencies = await getServerDependencies();
  const events = await dependencies.audit.listForUser(userId);

  return events.map((event) => ({
    id: event.id,
    date: event.timestamp,
    title: auditTitle(event.action),
    description: auditDescription(event.action, event.metadata),
  }));
}

async function writeAudit(
  actorUserId: string,
  targetUserId: string,
  action: AuditAction,
  resourceType: AuditResourceType,
  metadata?: Record<string, string | number | boolean | null>,
) {
  const dependencies = await getServerDependencies();
  await dependencies.audit.write({
    actorUserId,
    targetUserId,
    action,
    resourceType,
    resourceId: targetUserId,
    metadata,
  });
}

function normalizeExpiredStatus(
  status: SubscriptionStatus,
  expiresAt: Date | null,
): SubscriptionStatus {
  if (
    status !== "STOPPED" &&
    expiresAt &&
    expiresAt.getTime() < Date.now()
  ) {
    return "EXPIRED";
  }
  return status;
}

function parseDate(value: string, error: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(error);
  return date;
}

function addMonthsClamped(source: Date, months: number) {
  const day = source.getDate();
  const result = new Date(source);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function createInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function generateTemporaryPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits + symbols;
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 16) chars.push(pick(all));

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function pick(characters: string) {
  return characters[randomInt(characters.length)]!;
}

function auditTitle(action: string) {
  const map: Record<string, string> = {
    USER_CREATED: "Account created",
    PASSWORD_RESET: "Password reset",
    PLAN_CHANGED: "Plan changed",
    SUBSCRIPTION_RENEWED: "Subscription renewed",
    SUBSCRIPTION_STOP_RENEWAL: "Renewal stopped",
    SUBSCRIPTION_RESUMED: "Renewal resumed",
    SUBSCRIPTION_STOPPED: "Subscription stopped immediately",
    USER_SUSPENDED: "Account suspended",
    USER_REACTIVATED: "Account reactivated",
    PROFILE_ENABLED: "Public profile enabled",
    PROFILE_DISABLED: "Public profile disabled",
    SLUG_CHANGED: "Profile slug changed",
  };
  return map[action] ?? action.replaceAll("_", " ").toLowerCase();
}

function auditDescription(
  action: string,
  metadata?: Record<string, string | number | boolean | null>,
) {
  if (action === "PLAN_CHANGED") return `${metadata?.previousPlan ?? "Plan"} changed to ${metadata?.nextPlan ?? "new plan"}.`;
  if (action === "SUBSCRIPTION_RENEWED" && typeof metadata?.months === "number" && metadata.months > 0) return `Subscription extended by ${metadata.months} month${metadata.months === 1 ? "" : "s"}.`;
  if (action === "SLUG_CHANGED") return `Public URL changed from /${metadata?.previousSlug ?? ""} to /${metadata?.nextSlug ?? ""}.`;
  if (action === "USER_SUSPENDED" && metadata?.reason) return String(metadata.reason);
  return "Administrative change recorded on the server.";
}
