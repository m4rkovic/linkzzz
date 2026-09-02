import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import AccountOverviewCard from "@/components/account/account-overview-card";
import type { AccountSummary } from "@/features/account/account-types";
import { getPlanDefinition } from "@/features/plans/plan-catalog";

function getStatusLabel(status: AccountSummary["subscriptionStatus"]) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "CANCEL_AT_PERIOD_END":
      return "Cancels at expiry";
    case "EXPIRED":
      return "Expired";
    case "STOPPED":
      return "Stopped";
  }
}

function getStatusClass(status: AccountSummary["subscriptionStatus"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";
    case "CANCEL_AT_PERIOD_END":
      return "bg-amber-50 text-amber-700";
    case "EXPIRED":
      return "bg-orange-50 text-orange-700";
    case "STOPPED":
      return "bg-red-50 text-red-700";
  }
}

export default function SubscriptionCard({ account }: { account: AccountSummary }) {
  const plan = getPlanDefinition(account.plan);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-500">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">{plan.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {plan.smartLinkDisplay} Smart Links · {plan.pageLinkLimit} links per Landing Page.
            </p>
          </div>

          <span className={`inline-flex self-start items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(account.subscriptionStatus)}`}>
            <CheckCircle2 size={15} />
            {getStatusLabel(account.subscriptionStatus)}
          </span>
        </div>
      </div>

      <div className="grid gap-3 border-t border-zinc-100 bg-zinc-50/40 p-4 sm:grid-cols-3 sm:p-5">
        <AccountOverviewCard icon={CalendarDays} label="Current period" value={account.periodLabel} />
        <AccountOverviewCard icon={Clock3} label="Expires" value={account.expiresLabel} />
        <AccountOverviewCard icon={RefreshCw} label="Auto renewal" value={account.autoRenew ? "Enabled" : "Disabled"} />
      </div>
    </section>
  );
}
