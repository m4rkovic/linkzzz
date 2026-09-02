import { redirect } from "next/navigation";
import { Check, Layers3, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cardClassName } from "@/components/ui/card";
import { getAccountSummary } from "@/server/account/account-service";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  PLAN_CATALOG,
  PLAN_ORDER,
  type PlanId,
} from "@/features/plans/plan-catalog";

export default async function PlansPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const account = await getAccountSummary(session.user.id);
  if (!account) return null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Plans</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
          Choose the amount of room you need.
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          For now, plans differ only by Smart Link capacity and the number of links available inside each Landing Page.
        </p>
      </div>

      <div className="mt-7 grid gap-4 lg:grid-cols-3">
        {PLAN_ORDER.map((planId) => (
          <PlanCard key={planId} planId={planId} currentPlan={account.plan} />
        ))}
      </div>

      <div className={cardClassName({ padding: "none", className: "mt-5 px-5 py-4 text-sm leading-6 text-zinc-500" })}>
        Plan changes are currently managed by a Linkzzz administrator. Existing content is never deleted automatically if a plan changes.
      </div>
    </div>
  );
}

function PlanCard({ planId, currentPlan }: { planId: PlanId; currentPlan: PlanId }) {
  const plan = PLAN_CATALOG[planId];
  const selected = planId === currentPlan;

  return (
    <article
      className={`relative overflow-hidden rounded-[28px] border p-6 sm:p-7 ${
        selected
          ? "border-brand-violet bg-zinc-950 text-white shadow-xl shadow-brand-violet/15"
          : "border-zinc-200 bg-white text-zinc-950"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${selected ? "text-zinc-400" : "text-zinc-400"}`}>
            {plan.name}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight">${plan.priceUsdMonthly}</span>
            <span className={`pb-1 text-sm ${selected ? "text-zinc-400" : "text-zinc-500"}`}>/ month</span>
          </div>
        </div>

        {selected && (
          <Badge tone="success" className="gap-1.5 px-3 py-1.5 text-[11px]">
            <Check size={13} /> Current
          </Badge>
        )}
      </div>

      <p className={`mt-5 min-h-12 text-sm leading-6 ${selected ? "text-zinc-300" : "text-zinc-500"}`}>
        {plan.description}
      </p>

      <div className={`mt-6 space-y-3 border-t pt-5 ${selected ? "border-zinc-800" : "border-zinc-100"}`}>
        <PlanFeature
          icon={Link2}
          value={`${plan.smartLinkDisplay} Smart Links`}
          detail="Total Smart Links in your workspace"
          selected={selected}
        />
        <PlanFeature
          icon={Layers3}
          value={`${plan.pageLinkLimit} links per Landing Page`}
          detail="Cards/destinations inside one page"
          selected={selected}
        />
      </div>
    </article>
  );
}

function PlanFeature({
  icon: Icon,
  value,
  detail,
  selected,
}: {
  icon: typeof Link2;
  value: string;
  detail: string;
  selected: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-brand-violet-strong text-white" : "bg-brand-violet-soft text-brand-violet-strong"}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-bold">{value}</p>
        <p className={`mt-0.5 text-xs leading-5 ${selected ? "text-zinc-400" : "text-zinc-500"}`}>{detail}</p>
      </div>
    </div>
  );
}
