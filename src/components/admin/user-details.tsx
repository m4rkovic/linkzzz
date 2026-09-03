"use client";

import { useState } from "react";
import { CalendarDays, Link2, RefreshCw, ShieldAlert, UserRound } from "lucide-react";

import AdminConfirmDialog from "@/components/admin/ui/admin-confirm-dialog";
import ResetPasswordModal from "@/components/admin/user/reset-password-modal";
import SubscriptionControls from "@/components/admin/user/subscription-controls";
import SubscriptionHistory from "@/components/admin/user/subscription-history";
import SuspendUserModal from "@/components/admin/user/suspend-user-modal";
import UserAccountCard from "@/components/admin/user/user-account-card";
import UserHeader from "@/components/admin/user/user-header";
import UserSmartLinksCard from "@/components/admin/user/user-smart-links-card";
import type { AdminPlan } from "@/features/admin/admin-types";
import { formatAdminDate, getPlanLimit, getPlanUsageLabel } from "@/features/admin/subscription-rules";
import { getPlanDefinition } from "@/features/plans/plan-catalog";
import { useAdminUser } from "@/features/admin/use-admin-user";
import { getAllowedSubscriptionActions } from "@/server/business/subscriptions";
import type { AdminHistorySnapshot, AdminUserSnapshot } from "@/types/admin-api";

 type ConfirmAction =
  | { type: "NONE" }
  | { type: "STOP_IMMEDIATELY" }
  | { type: "DOWNGRADE"; plan: AdminPlan }
  | { type: "REACTIVATE" };

export default function UserDetails({
  userId,
  initialData,
}: {
  userId: string;
  initialData: { user: AdminUserSnapshot; history: AdminHistorySnapshot[] };
}) {
  const {
    user,
    history,
    renewSubscription,
    stopRenewal,
    resumeRenewal,
    stopImmediately,
    changePlan,
    setSmartLinkStatus,
    suspendAccount,
    reactivateAccount,
    resetPassword,
    loading,
    error,
  } = useAdminUser(userId, initialData);

  const [resetOpen, setResetOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ type: "NONE" });

  if (loading && !user) return <CustomerLoading />;
  if (!user) {
    return <div role="alert" className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error || "Customer could not be loaded."}</div>;
  }

  const subscriptionUsable = user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "CANCEL_AT_PERIOD_END";
  const canRestoreLinks = user.accountStatus === "ACTIVE" && subscriptionUsable;
  const allowedSubscriptionActions = getAllowedSubscriptionActions(
    user.subscriptionStatus,
    user.periodEnd,
  );
  const canStopImmediately = allowedSubscriptionActions.includes("STOP_IMMEDIATELY");

  function requestPlanChange(plan: AdminPlan) {
    if (plan === user!.plan) return;
    if (user!.linksUsed > getPlanLimit(plan)) {
      setConfirmAction({ type: "DOWNGRADE", plan });
      return;
    }
    void changePlan(plan);
  }

  function confirmCurrentAction() {
    switch (confirmAction.type) {
      case "STOP_IMMEDIATELY":
        void stopImmediately();
        break;
      case "DOWNGRADE":
        void changePlan(confirmAction.plan);
        break;
      case "REACTIVATE":
        void reactivateAccount();
        break;
      case "NONE":
        return;
    }
    setConfirmAction({ type: "NONE" });
  }

  const confirmCopy = getConfirmCopy(confirmAction, user.linksUsed);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <UserHeader user={user} onResetPassword={() => setResetOpen(true)} />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard icon={UserRound} label="Plan" value={getPlanDefinition(user.plan).name} />
        <OverviewCard icon={CalendarDays} label="Expires" value={formatAdminDate(user.periodEnd)} />
        <OverviewCard icon={RefreshCw} label="Auto renewal" value={user.autoRenew ? "Enabled" : "Disabled"} />
        <OverviewCard icon={Link2} label="Smart Links" value={getPlanUsageLabel(user.plan, user.linksUsed)} />
      </div>

      <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-w-0 space-y-6">
          <SubscriptionControls
            user={user}
            onRenew={(months) => { void renewSubscription(months); }}
            onStopRenewal={() => { void stopRenewal(); }}
            onResumeRenewal={() => { void resumeRenewal(); }}
            onRequestPlanChange={requestPlanChange}
          />

          <UserSmartLinksCard
            smartLinks={user.smartLinks}
            canRestore={canRestoreLinks}
            onSetStatus={setSmartLinkStatus}
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
                <p className="mt-1 text-sm leading-6 text-zinc-500">Immediately block sign-in and all public Smart Link access while preserving every saved Smart Link state.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-red-50 p-4 text-xs leading-5 text-red-700">Smart Links, assets, domains and analytics are preserved. Published/Draft states are not rewritten during the stop.</div>
            <button type="button" onClick={() => setConfirmAction({ type: "STOP_IMMEDIATELY" })} disabled={!canStopImmediately} className="mt-4 min-h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">Stop instantly</button>
          </section>

          <SubscriptionHistory history={history} />

          <section className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-5">
            <p className="text-sm leading-6 text-zinc-600">Admin changes are persisted in PostgreSQL through Prisma and recorded in the audit log.</p>
          </section>
        </div>
      </div>

      <ResetPasswordModal open={resetOpen} onClose={() => setResetOpen(false)} onReset={resetPassword} />
      <SuspendUserModal open={suspendOpen} onClose={() => setSuspendOpen(false)} onSuspend={(reason) => { void suspendAccount(reason); }} />
      <AdminConfirmDialog open={confirmAction.type !== "NONE"} title={confirmCopy.title} description={confirmCopy.description} confirmLabel={confirmCopy.confirmLabel} danger={confirmCopy.danger} onCancel={() => setConfirmAction({ type: "NONE" })} onConfirm={confirmCurrentAction} />
    </div>
  );
}

function CustomerLoading() {
  return <div className="mx-auto max-w-7xl space-y-5" aria-label="Loading customer"><div className="h-20 animate-pulse rounded-2xl bg-zinc-100"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100"/>)}</div><div className="h-96 animate-pulse rounded-2xl bg-zinc-100"/></div>;
}

function OverviewCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"><Icon size={18}/></div><p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p><p className="mt-1 break-words text-sm font-semibold text-zinc-900">{value}</p></section>;
}

function getConfirmCopy(action: ConfirmAction, linksUsed: number) {
  switch (action.type) {
    case "STOP_IMMEDIATELY": return { title: "Stop subscription immediately?", description: "Customer sign-in and all public Smart Link access will stop now. Existing Smart Link publication states and data remain preserved.", confirmLabel: "Stop immediately", danger: true };
    case "DOWNGRADE": { const targetPlan = getPlanDefinition(action.plan); return { title: `Change plan to ${targetPlan.name}?`, description: `This customer currently has ${linksUsed} Smart Links. Existing Smart Links stay intact, but new Smart Links will be blocked until usage is within the ${targetPlan.smartLinkDisplay} Smart Link allowance.`, confirmLabel: "Change plan", danger: false }; }
    case "REACTIVATE": return { title: "Reactivate account?", description: "Customer sign-in and eligible published Smart Links will become available again, subject to subscription status.", confirmLabel: "Reactivate", danger: false };
    case "NONE": return { title: "Confirm action", description: "", confirmLabel: "Confirm", danger: false };
  }
}
