import "server-only";

import { randomInt } from "node:crypto";
import { defaultAppearance } from "@/config/profile-defaults";
import type { AuditAction, AuditResourceType } from "@/server/audit/types";
import { passwordHasher } from "@/server/auth/password-hasher";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import {
  assessPlanChange,
  assessSmartLinkPlanChange,
  type Plan,
} from "@/server/business/plans";
import type { SubscriptionStatus } from "@/server/business/subscriptions";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { UserRecord } from "@/server/services/contracts";
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

export type AdminOverviewSnapshot = {
  totalCustomers: number;
  activeSubscriptions: number;
  expiringSoon: number;
  expired: number;
  cancelling: number;
  suspended: number;
  accessBlocked: number;
  totalSmartLinks: number;
  planCounts: Record<Plan, number>;
  expiringUsers: AdminUserListItem[];
};

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const dependencies = await getServerDependencies();
  const customers = await dependencies.adminRead.listCustomers();
  return customers.map(({ user, displayName, subscription, smartLinks }) =>
    toAdminUserListItem({
      id: user.id,
      displayName,
      username: user.username,
      email: user.email,
      initials: createInitials(displayName),
      plan: subscription.plan,
      subscriptionStatus: normalizeExpiredStatus(
        subscription.status,
        subscription.expiresAt,
      ),
      accountStatus: user.accountStatus,
      autoRenew: subscription.autoRenew,
      periodStart: subscription.startedAt.toISOString(),
      periodEnd: (subscription.expiresAt ?? subscription.startedAt).toISOString(),
      linksUsed: smartLinks.length,
      smartLinks: smartLinks.map((smartLink) => ({
        ...smartLink,
        updatedAt: smartLink.updatedAt.toISOString(),
      })),
    }),
  );
}

export async function getAdminOverview(): Promise<AdminOverviewSnapshot> {
  const users = await listAdminUsers();
  const now = Date.now();
  const sevenDays = 7 * 86_400_000;
  const activeSubscriptions = users.filter((user) =>
    user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "CANCEL_AT_PERIOD_END"
  ).length;
  const expiringUsers = users
    .filter((user) => {
      const remaining = new Date(user.periodEnd).getTime() - now;
      return remaining >= 0 && remaining <= sevenDays &&
        user.subscriptionStatus !== "EXPIRED" && user.subscriptionStatus !== "STOPPED";
    })
    .sort((a, b) => new Date(a.periodEnd).getTime() - new Date(b.periodEnd).getTime());

  return {
    totalCustomers: users.length,
    activeSubscriptions,
    expiringSoon: expiringUsers.length,
    expired: users.filter((user) => user.subscriptionStatus === "EXPIRED").length,
    cancelling: users.filter((user) => user.subscriptionStatus === "CANCEL_AT_PERIOD_END").length,
    suspended: users.filter((user) => user.accountStatus !== "ACTIVE").length,
    accessBlocked: users.filter((user) => user.accountStatus !== "ACTIVE" || user.subscriptionStatus === "EXPIRED" || user.subscriptionStatus === "STOPPED").length,
    totalSmartLinks: users.reduce((sum, user) => sum + user.linksUsed, 0),
    planCounts: {
      BASIC: users.filter((user) => user.plan === "BASIC").length,
      PRO: users.filter((user) => user.plan === "PRO").length,
      ENTERPRISE: users.filter((user) => user.plan === "ENTERPRISE").length,
    },
    expiringUsers: expiringUsers.slice(0, 6),
  };
}

export async function getAdminUser(userId: string): Promise<AdminActionResult | null> {
  const dependencies = await getServerDependencies();
  const user = await dependencies.users.findById(userId);
  if (!user || user.role !== "CUSTOMER") return null;

  const [snapshot, history] = await Promise.all([
    buildAdminUserSnapshot(userId, user),
    buildAdminHistory(userId),
  ]);

  return {
    user: snapshot,
    history,
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

  const displayName = input.displayName.trim();
  if (displayName.length > 60) throw new Error("Display name cannot exceed 60 characters.");

  const email = input.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address.");

  const periodStart = parseDate(input.periodStart, "Invalid subscription start date.");
  const periodEnd = parseDate(input.periodEnd, "Invalid subscription expiry date.");
  if (periodEnd <= periodStart) throw new Error("Subscription expiry must be after the start date.");

  const dependencies = await getServerDependencies();
  const [existingUsername, existingEmail, existingSlug] = await Promise.all([
    dependencies.users.findByLogin(usernameValidation.value),
    dependencies.users.findByLogin(email),
    dependencies.smartLinks.findBySlug(slugValidation.value),
  ]);
  if (existingUsername) throw new Error("Username is already in use.");
  if (existingEmail) throw new Error("Email address is already in use.");
  if (existingSlug) throw new Error("Smart Link slug already exists.");

  const passwordHash = await passwordHasher.hash(input.password);
  const profile: PersistedProfileData = {
    slug: slugValidation.value,
    displayName: displayName || usernameValidation.value,
    username: usernameValidation.value,
    bio: "",
    status: "DRAFT",
    stats: [],
    socials: [],
    links: [],
    contentBlocks: [],
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
  if (!subscription) throw new Error("Customer subscription is missing.");

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
      await dependencies.sessions.revokeAllForUser(userId);
      await writeAudit(admin.user.id, userId, "SUBSCRIPTION_STOPPED", "SUBSCRIPTION");
      break;

    case "CHANGE_PLAN": {
      const profile = await dependencies.profiles.findByUserId(userId);
      if (!profile) throw new Error("Customer Landing Page data is incomplete.");
      const smartLinkCount = await dependencies.smartLinks.countForUser(userId);
      const pageCardAssessment = assessPlanChange(
        subscription.plan,
        action.plan,
        profile.links.length,
      );
      const smartLinkAssessment = assessSmartLinkPlanChange(
        subscription.plan,
        action.plan,
        smartLinkCount,
      );
      await dependencies.subscriptions.upsert({ ...subscription, plan: action.plan });
      await writeAudit(admin.user.id, userId, "PLAN_CHANGED", "SUBSCRIPTION", {
        previousPlan: subscription.plan,
        nextPlan: action.plan,
        overNewLimit:
          pageCardAssessment.exceedsNewLimit ||
          smartLinkAssessment.exceedsNewLimit,
        pageCardsOverNewLimit: pageCardAssessment.linksToRemoveBeforeAddingNew,
        smartLinksOverNewLimit:
          smartLinkAssessment.linksToRemoveBeforeAddingNew,
      });
      break;
    }

    case "SET_SMART_LINK_STATUS": {
      const smartLink = await dependencies.smartLinks.findByIdForUser(action.smartLinkId, userId);
      if (!smartLink) throw new Error("Smart Link not found.");

      if (action.status === "DISABLED" && smartLink.status !== "PUBLISHED") {
        throw new Error("Only published Smart Links can be disabled by an administrator.");
      }
      if (action.status === "PUBLISHED") {
        const accessActive = user.accountStatus === "ACTIVE" &&
          normalizeExpiredStatus(subscription.status, subscription.expiresAt) !== "EXPIRED" &&
          subscription.status !== "STOPPED";
        if (!accessActive) {
          throw new Error("Restore the customer account and subscription before enabling this Smart Link.");
        }
        if (smartLink.status !== "DISABLED") {
          throw new Error("Only administrator-disabled Smart Links can be restored.");
        }
      }

      const write = await dependencies.smartLinks.updateIfRevision(
        smartLink.id,
        userId,
        {
          title: smartLink.title,
          slug: smartLink.slug,
          status: action.status,
          primaryDestination: smartLink.primaryDestination,
          deeplink: smartLink.deeplink,
          geo: smartLink.geo,
          shield: smartLink.shield,
          tracking: smartLink.tracking,
        },
        smartLink.revision,
      );
      if (!write.ok) throw new Error("Smart Link changed while the admin action was being applied. Try again.");

      await writeAudit(
        admin.user.id,
        userId,
        action.status === "DISABLED" ? "SMART_LINK_DISABLED" : "SMART_LINK_ENABLED",
        "SMART_LINK",
        { title: smartLink.title, slug: smartLink.slug },
        smartLink.id,
      );
      break;
    }

    case "SUSPEND":
      await dependencies.users.update(userId, { accountStatus: "SUSPENDED" });
      await dependencies.sessions.revokeAllForUser(userId);
      await writeAudit(admin.user.id, userId, "USER_SUSPENDED", "USER", {
        reason: action.reason?.trim() || null,
      });
      break;

    case "REACTIVATE": {
      const effectiveSubscription = normalizeExpiredStatus(subscription.status, subscription.expiresAt);
      if (effectiveSubscription === "STOPPED" || effectiveSubscription === "EXPIRED") {
        throw new Error("Renew the subscription before reactivating this account.");
      }
      await dependencies.users.update(userId, { accountStatus: "ACTIVE" });
      await writeAudit(admin.user.id, userId, "USER_REACTIVATED", "USER");
      break;
    }

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

async function buildAdminUserSnapshot(
  userId: string,
  knownUser?: UserRecord,
): Promise<AdminUserSnapshot> {
  const dependencies = await getServerDependencies();
  const [user, subscription, profile, smartLinks] = await Promise.all([
    knownUser ? Promise.resolve(knownUser) : dependencies.users.findById(userId),
    dependencies.subscriptions.findByUserId(userId),
    dependencies.profiles.findByUserId(userId),
    dependencies.smartLinks.listForUser(userId),
  ]);
  if (!user || !subscription || !profile) throw new Error("Customer data is incomplete.");

  return {
    id: user.id,
    displayName: profile.displayName || user.username,
    username: user.username,
    email: user.email,
    initials: createInitials(profile.displayName || user.username),
    plan: subscription.plan,
    subscriptionStatus: normalizeExpiredStatus(subscription.status, subscription.expiresAt),
    accountStatus: user.accountStatus,
    autoRenew: subscription.autoRenew,
    periodStart: subscription.startedAt.toISOString(),
    periodEnd: (subscription.expiresAt ?? subscription.startedAt).toISOString(),
    linksUsed: smartLinks.length,
    smartLinks: smartLinks.map((smartLink) => ({
      id: smartLink.id,
      title: smartLink.title,
      slug: smartLink.slug,
      type: smartLink.type,
      status: smartLink.status,
      updatedAt: smartLink.updatedAt.toISOString(),
    })),
  };
}

function toAdminUserListItem(user: AdminUserSnapshot): AdminUserListItem {
  const { smartLinks, ...summary } = user;
  return {
    ...summary,
    publishedLinks: smartLinks.filter((smartLink) => smartLink.status === "PUBLISHED").length,
    draftLinks: smartLinks.filter((smartLink) => smartLink.status === "DRAFT").length,
    disabledLinks: smartLinks.filter((smartLink) => smartLink.status === "DISABLED").length,
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
  resourceId = targetUserId,
) {
  const dependencies = await getServerDependencies();
  await dependencies.audit.write({
    actorUserId,
    targetUserId,
    action,
    resourceType,
    resourceId,
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
    SMART_LINK_DISABLED: "Smart Link disabled",
    SMART_LINK_ENABLED: "Smart Link restored",
  };
  return map[action] ?? action.replaceAll("_", " ").toLowerCase();
}

function auditDescription(
  action: string,
  metadata?: Record<string, string | number | boolean | null>,
) {
  if (action === "PLAN_CHANGED") return `${metadata?.previousPlan ?? "Plan"} changed to ${metadata?.nextPlan ?? "new plan"}.`;
  if (action === "SUBSCRIPTION_RENEWED" && typeof metadata?.months === "number" && metadata.months > 0) return `Subscription extended by ${metadata.months} month${metadata.months === 1 ? "" : "s"}.`;
  if (action === "SMART_LINK_DISABLED") return `${metadata?.title ?? "Smart Link"} was disabled by an administrator.`;
  if (action === "SMART_LINK_ENABLED") return `${metadata?.title ?? "Smart Link"} was restored by an administrator.`;
  if (action === "USER_SUSPENDED" && metadata?.reason) return String(metadata.reason);
  return "Administrative change recorded on the server.";
}
