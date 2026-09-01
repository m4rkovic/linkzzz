"use client";

import { useState } from "react";
import {
  CalendarDays,
  Link2,
  RefreshCw,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import AdminConfirmDialog from "@/components/admin/ui/admin-confirm-dialog";
import ChangeSlugModal from "@/components/admin/user/change-slug-modal";
import ResetPasswordModal from "@/components/admin/user/reset-password-modal";
import SubscriptionControls from "@/components/admin/user/subscription-controls";
import SubscriptionHistory from "@/components/admin/user/subscription-history";
import SuspendUserModal from "@/components/admin/user/suspend-user-modal";
import UserAccountCard from "@/components/admin/user/user-account-card";
import UserHeader from "@/components/admin/user/user-header";
import UserProfileCard from "@/components/admin/user/user-profile-card";
import type { AdminPlan } from "@/features/admin/admin-types";
import { formatAdminDate, getPlanLimit } from "@/features/admin/subscription-rules";
import { useAdminUser } from "@/features/admin/use-admin-user";

type ConfirmAction =
  | { type: "NONE" }
  | { type: "STOP_IMMEDIATELY" }
  | { type: "DOWNGRADE"; plan: AdminPlan }
  | { type: "REACTIVATE" }
  | { type: "DISABLE_PROFILE" }
  | { type: "ENABLE_PROFILE" };

export default function UserDetails({ userId }: { userId: string }) {
  const {
    user,
    history,
    renewSubscription,
    stopRenewal,
    resumeRenewal,
    stopImmediately,
    changePlan,
    setProfileStatus,
    changeSlug,
    suspendAccount,
    reactivateAccount,
    resetPassword,
    loading,
    error,
  } = useAdminUser(userId);

  const [resetOpen, setResetOpen] = useState(false);
  const [slugOpen, setSlugOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ type: "NONE" });

  const maxLinks = getPlanLimit(user.plan);

  function requestPlanChange(plan: AdminPlan) {
    if (plan === user.plan) return;

    if (plan === "PREMIUM" && user.linksUsed > 40) {
      setConfirmAction({ type: "DOWNGRADE", plan });
      return;
    }

    changePlan(plan);
  }

  function requestProfileToggle() {
    setConfirmAction({
      type: user.profileStatus === "PUBLISHED" ? "DISABLE_PROFILE" : "ENABLE_PROFILE",
    });
  }

  function confirmCurrentAction() {
    switch (confirmAction.type) {
      case "STOP_IMMEDIATELY":
        stopImmediately();
        break;
      case "DOWNGRADE":
        changePlan(confirmAction.plan);
        break;
      case "REACTIVATE":
        reactivateAccount();
        break;
      case "DISABLE_PROFILE":
        setProfileStatus("DISABLED");
        break;
      case "ENABLE_PROFILE":
        setProfileStatus("PUBLISHED");
        break;
      case "NONE":
        return;
    }

    setConfirmAction({ type: "NONE" });
  }

  const confirmCopy = getConfirmCopy(confirmAction, user.linksUsed);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-xl bg-zinc-100 p-3 text-sm text-zinc-500">Loading customer data...</div>}
      <UserHeader user={user} onResetPassword={() => setResetOpen(true)} />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard icon={UserRound} label="Plan" value={user.plan === "PREMIUM_PLUS" ? "Premium Plus" : "Premium"} />
        <OverviewCard icon={CalendarDays} label="Expires" value={formatAdminDate(user.periodEnd)} />
        <OverviewCard icon={RefreshCw} label="Auto renewal" value={user.autoRenew ? "Enabled" : "Disabled"} />
        <OverviewCard icon={Link2} label="Links" value={`${user.linksUsed} / ${maxLinks}`} />
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-w-0 space-y-6">
          <SubscriptionControls
            user={user}
            onRenew={renewSubscription}
            onStopRenewal={stopRenewal}
            onResumeRenewal={resumeRenewal}
            onRequestPlanChange={requestPlanChange}
          />

          <UserProfileCard
            user={user}
            onChangeSlug={() => setSlugOpen(true)}
            onToggleProfile={requestProfileToggle}
          />

          <UserAccountCard
            user={user}
            onSuspend={() => setSuspendOpen(true)}
            onReactivate={() => setConfirmAction({ type: "REACTIVATE" })}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><ShieldAlert size={19} /></div>
              <div className="min-w-0">
                <h2 className="font-semibold text-zinc-950">Immediate stop</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">Immediately disable customer access and the public profile while preserving all profile data.</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs leading-5 text-red-700">Links, images, analytics and other customer data are not deleted.</div>

            <button
              type="button"
              onClick={() => setConfirmAction({ type: "STOP_IMMEDIATELY" })}
              disabled={user.subscriptionStatus === "STOPPED"}
              className="mt-4 min-h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Stop instantly
            </button>
          </section>

          <SubscriptionHistory history={history} />

          <section className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-5">
            <p className="text-sm leading-6 text-zinc-600">
              Admin changes are persisted server-side in the temporary JSON storage layer and recorded in the audit log.
            </p>
          </section>
        </div>
      </div>

      <ResetPasswordModal open={resetOpen} onClose={() => setResetOpen(false)} onReset={resetPassword} />
      <ChangeSlugModal open={slugOpen} currentSlug={user.slug} onClose={() => setSlugOpen(false)} onSave={changeSlug} />
      <SuspendUserModal open={suspendOpen} onClose={() => setSuspendOpen(false)} onSuspend={suspendAccount} />

      <AdminConfirmDialog
        open={confirmAction.type !== "NONE"}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        danger={confirmCopy.danger}
        onCancel={() => setConfirmAction({ type: "NONE" })}
        onConfirm={confirmCurrentAction}
      />
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"><Icon size={18} /></div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-900">{value}</p>
    </section>
  );
}

function getConfirmCopy(action: ConfirmAction, linksUsed: number) {
  switch (action.type) {
    case "STOP_IMMEDIATELY":
      return {
        title: "Stop subscription immediately?",
        description: "Customer access and the public profile will be disabled now. Existing data remains preserved.",
        confirmLabel: "Stop immediately",
        danger: true,
      };
    case "DOWNGRADE":
      return {
        title: "Downgrade to Premium?",
        description: `This customer currently has ${linksUsed} links. Existing links stay intact, but new links will be blocked until usage is 40 or fewer.`,
        confirmLabel: "Downgrade plan",
        danger: false,
      };
    case "REACTIVATE":
      return {
        title: "Reactivate account?",
        description: "Customer sign-in access will be restored. The public profile remains controlled separately.",
        confirmLabel: "Reactivate",
        danger: false,
      };
    case "DISABLE_PROFILE":
      return {
        title: "Disable public profile?",
        description: "Visitors will no longer be able to open this public profile. Profile data remains unchanged.",
        confirmLabel: "Disable profile",
        danger: true,
      };
    case "ENABLE_PROFILE":
      return {
        title: "Enable public profile?",
        description: "The profile will become publicly accessible again.",
        confirmLabel: "Enable profile",
        danger: false,
      };
    case "NONE":
      return {
        title: "Confirm action",
        description: "",
        confirmLabel: "Confirm",
        danger: false,
      };
  }
}
