import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, PauseCircle, PlayCircle } from "lucide-react";

import type { AdminPlan, AdminUserModel } from "@/features/admin/admin-types";
import { formatAdminDate, getPlanLimit } from "@/features/admin/subscription-rules";

export default function SubscriptionControls({
  user,
  onRenew,
  onStopRenewal,
  onResumeRenewal,
  onRequestPlanChange,
}: {
  user: AdminUserModel;
  onRenew: (months: number) => void;
  onStopRenewal: () => void;
  onResumeRenewal: () => void;
  onRequestPlanChange: (plan: AdminPlan) => void;
}) {
  const maxLinks = getPlanLimit(user.plan);
  const overLimit = user.linksUsed > maxLinks;
  const usagePercentage = Math.min((user.linksUsed / maxLinks) * 100, 100);

  return (
    <div className="space-y-6">
      <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-950">Subscription</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage the current period and renewal state.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DataBox icon={CalendarDays} label="Period start" value={formatAdminDate(user.periodStart)} />
          <DataBox icon={Clock3} label="Period end" value={formatAdminDate(user.periodEnd)} />
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-zinc-900">Renew subscription</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {[1, 3, 6, 12].map((months) => (
              <button key={months} type="button" onClick={() => onRenew(months)} className="min-h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800">
                +{months} {months === 1 ? "month" : "months"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 border-t border-zinc-100 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Automatic renewal</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{user.autoRenew ? "Subscription currently renews automatically." : "Automatic renewal is currently disabled."}</p>
            </div>

            {user.subscriptionStatus === "CANCEL_AT_PERIOD_END" ? (
              <button type="button" onClick={onResumeRenewal} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 sm:w-auto">
                <PlayCircle size={17} /> Resume renewal
              </button>
            ) : (
              <button type="button" onClick={onStopRenewal} disabled={user.subscriptionStatus !== "ACTIVE"} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
                <PauseCircle size={17} /> Stop renewal
              </button>
            )}
          </div>

          {user.subscriptionStatus === "CANCEL_AT_PERIOD_END" && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <Clock3 size={18} className="mt-0.5 shrink-0 text-amber-700" />
              Customer keeps access until <strong>{formatAdminDate(user.periodEnd)}</strong>.
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-950">Plan</h2>
        <p className="mt-1 text-sm text-zinc-500">Change the link limit without deleting existing links.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <PlanOption name="Premium" description="Up to 40 links" selected={user.plan === "PREMIUM"} onClick={() => onRequestPlanChange("PREMIUM")} />
          <PlanOption name="Premium Plus" description="Up to 100 links" selected={user.plan === "PREMIUM_PLUS"} onClick={() => onRequestPlanChange("PREMIUM_PLUS")} />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-zinc-800">Link usage</p>
            <p className={`text-sm font-bold ${overLimit ? "text-red-600" : "text-zinc-950"}`}>{user.linksUsed} / {maxLinks}</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className={`h-full rounded-full ${overLimit ? "bg-red-600" : "bg-zinc-950"}`} style={{ width: `${usagePercentage}%` }} />
          </div>
          {overLimit && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 p-4">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-600" />
              <p className="text-sm leading-6 text-red-700">Existing links stay intact, but new links are blocked until usage falls back to the plan limit.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DataBox({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="flex items-center gap-2 text-zinc-400"><Icon size={15} /><p className="text-xs font-medium">{label}</p></div>
      <p className="mt-2 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function PlanOption({ name, description, selected, onClick }: { name: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`min-h-24 rounded-2xl border p-4 text-left transition ${selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white hover:border-zinc-400"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{name}</p>
        {selected && <CheckCircle2 size={17} />}
      </div>
      <p className={`mt-2 text-xs ${selected ? "text-zinc-400" : "text-zinc-500"}`}>{description}</p>
    </button>
  );
}
