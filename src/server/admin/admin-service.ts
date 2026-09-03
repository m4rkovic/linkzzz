import "server-only";

import { defaultAppearance } from "@/config/profile-defaults";
import { passwordHasher } from "@/server/auth/password-hasher";
import type { AuthenticatedSession } from "@/server/auth/auth-service";
import type { Plan } from "@/server/business/plans";
import { parseSubscriptionDateInput } from "@/server/business/subscription-dates";
import { getEffectiveSubscriptionStatus } from "@/server/business/subscriptions";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { UserRecord } from "@/server/services/contracts";
import { validateSlug } from "@/server/validation/slug";
import { validatePassword } from "@/server/validation/password";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type {
  AdminHistorySnapshot,
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
      subscriptionStatus: getEffectiveSubscriptionStatus(
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

  const periodStart = parseSubscriptionDateInput(input.periodStart);
  if (!periodStart) throw new Error("Invalid subscription start date.");
  const periodEnd = parseSubscriptionDateInput(input.periodEnd);
  if (!periodEnd) throw new Error("Invalid subscription expiry date.");
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
    subscriptionStatus: getEffectiveSubscriptionStatus(
      subscription.status,
      subscription.expiresAt,
    ),
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

function createInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
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
