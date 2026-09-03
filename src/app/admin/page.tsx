import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock3, Crown, Link2, ShieldAlert, Users } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { getPlanUsageLabel } from "@/features/admin/subscription-rules";
import { PLAN_CATALOG, PLAN_ORDER } from "@/features/plans/plan-catalog";
import { getAdminOverview } from "@/server/admin/admin-service";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function AdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.principal.role !== "ADMIN") redirect("/dashboard");

  const overview = await getAdminOverview();

  const stats = [
    { label: "Total customers", value: overview.totalCustomers, detail: `${overview.totalSmartLinks} Smart Links across all accounts`, icon: Users },
    { label: "Active subscriptions", value: overview.activeSubscriptions, detail: `${overview.cancelling} cancelling at period end`, icon: CheckCircle2 },
    { label: "Expiring soon", value: overview.expiringSoon, detail: "Within the next 7 days", icon: Clock3 },
    { label: "Access blocked", value: overview.accessBlocked, detail: `${overview.suspended} suspended/stopped · ${overview.expired} expired`, icon: ShieldAlert },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight text-zinc-950">Overview</h1><p className="mt-1 text-sm text-zinc-500">Live customer, subscription and Smart Link capacity overview.</p></div>
        <Link href="/admin/users/new" className={buttonClassName({ variant: "primary", className: "font-black" })}>Create customer</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon }) => <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-zinc-500">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">{value}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700"><Icon size={20}/></div></div><p className="mt-4 text-xs text-zinc-400">{detail}</p></div>)}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PLAN_ORDER.map((planId) => { const plan = PLAN_CATALOG[planId]; return <section key={planId} className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-zinc-950">{plan.name}</p><p className="mt-1 text-xs text-zinc-500">{plan.smartLinkDisplay} Smart Links per account</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong"><Crown size={17}/></div></div><p className="mt-5 text-3xl font-black text-zinc-950">{overview.planCounts[planId]}</p><p className="mt-1 text-xs text-zinc-400">customer{overview.planCounts[planId] === 1 ? "" : "s"}</p></section>; })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="text-lg font-semibold text-zinc-950">Expiring soon</h2><p className="mt-1 text-sm text-zinc-500">Subscriptions ending in the next seven days, sorted by urgency.</p></div><Link href="/admin/users?view=expiring" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">View all</Link></div>
        {overview.expiringUsers.length === 0 ? <div className="p-8 text-center"><Clock3 size={24} className="mx-auto text-zinc-300"/><p className="mt-3 text-sm font-semibold text-zinc-700">No subscriptions expire in the next 7 days.</p></div> : <div className="divide-y divide-zinc-100">{overview.expiringUsers.map((user) => <div key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-zinc-950">{user.displayName}</p><p className="mt-1 truncate text-xs text-zinc-500">@{user.username} · {PLAN_CATALOG[user.plan].name}</p></div><div className="grid grid-cols-2 gap-3 sm:flex sm:items-center"><MiniStat icon={Link2} label="Usage" value={getPlanUsageLabel(user.plan, user.linksUsed)}/><MiniStat icon={AlertTriangle} label="Expires" value={formatDate(user.periodEnd)}/></div><Link href={`/admin/users/${user.id}`} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-semibold text-white">Manage</Link></div>)}</div>}
      </section>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) { return <div className="min-w-[120px] rounded-xl bg-zinc-50 p-3"><div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400"><Icon size={12}/>{label}</div><p className="mt-1 text-xs font-bold text-zinc-800">{value}</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value)); }
