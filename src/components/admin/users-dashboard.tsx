"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Clock3, Search, UserPlus, Users } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import type { AdminUserListItem } from "@/types/admin-api";
import { getPlanUsageLabel } from "@/features/admin/subscription-rules";
import { getPlanDefinition } from "@/features/plans/plan-catalog";
import { formatUtcDate } from "@/lib/date-format";

type QuickView = "ALL" | "EXPIRING" | "CANCELLING" | "EXPIRED";

export default function UsersDashboard({
  initialUsers,
  initialView,
  nowMs,
}: {
  initialUsers: AdminUserListItem[];
  initialView: QuickView;
  nowMs: number;
}) {
  const users = initialUsers;
  const [search, setSearch] = useState("");
  const [quickView, setQuickViewState] = useState<QuickView>(initialView);

  const counts = useMemo(() => ({
    total: users.length,
    expiring: users.filter((user) => isExpiringSoon(user, nowMs)).length,
    cancelling: users.filter((user) => user.subscriptionStatus === "CANCEL_AT_PERIOD_END").length,
    expired: users.filter((user) => effectiveStatus(user, nowMs) === "EXPIRED").length,
  }), [users, nowMs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || [user.displayName, user.username, user.email].some((value) => value.toLowerCase().includes(query));
      if (!matchesSearch) return false;
      if (quickView === "EXPIRING") return isExpiringSoon(user, nowMs);
      if (quickView === "CANCELLING") return user.subscriptionStatus === "CANCEL_AT_PERIOD_END";
      if (quickView === "EXPIRED") return effectiveStatus(user, nowMs) === "EXPIRED";
      return true;
    });
  }, [users, search, quickView, nowMs]);

  function setQuickView(view: QuickView) {
    setQuickViewState(view);
    const url = new URL(window.location.href);
    if (view === "ALL") url.searchParams.delete("view");
    else url.searchParams.set("view", view.toLowerCase());
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight text-zinc-950">Users</h1><p className="mt-1 text-sm text-zinc-500">Manage customer accounts, plans and subscriptions.</p></div>
      <Link href="/admin/users/new" className={buttonClassName({ variant: "primary", className: "font-black" })}><UserPlus size={17}/> Create user</Link>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Summary icon={Users} label="Total customers" value={counts.total} active={quickView === "ALL"} onClick={() => setQuickView("ALL")}/>
      <Summary icon={Clock3} label="Expiring soon" value={counts.expiring} active={quickView === "EXPIRING"} onClick={() => setQuickView("EXPIRING")}/>
      <Summary icon={AlertTriangle} label="Cancelling" value={counts.cancelling} active={quickView === "CANCELLING"} onClick={() => setQuickView("CANCELLING")}/>
      <Summary icon={CalendarDays} label="Expired" value={counts.expired} active={quickView === "EXPIRED"} onClick={() => setQuickView("EXPIRED")}/>
    </div>

    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="relative"><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, username or email" className="h-11 w-full rounded-xl border border-zinc-200 pl-10 pr-4 text-sm outline-none focus:border-zinc-400"/></div>
    </div>

    {filtered.length === 0 ? <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">No customers match this view.</div> : <>
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:block">
        <table className="w-full text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Smart Links</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3"></th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id} className="border-t border-zinc-100"><td className="px-5 py-4"><p className="font-semibold text-zinc-950">{user.displayName}</p><p className="mt-1 text-xs text-zinc-500">@{user.username} · {user.email}</p></td><td className="px-5 py-4 font-medium">{getPlanDefinition(user.plan).name}</td><td className="px-5 py-4"><Status user={user}/></td><td className="px-5 py-4">{getPlanUsageLabel(user.plan, user.linksUsed)}</td><td className="px-5 py-4">{formatDate(user.periodEnd)}</td><td className="px-5 py-4 text-right"><Link href={`/admin/users/${user.id}`} className="font-semibold text-zinc-950">Manage</Link></td></tr>)}</tbody></table>
      </div>
      <div className="space-y-3 lg:hidden">{filtered.map((user) => <Link key={user.id} href={`/admin/users/${user.id}`} className="block rounded-2xl border border-zinc-200 bg-white p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-semibold text-zinc-950">{user.displayName}</p><p className="mt-1 truncate text-xs text-zinc-500">@{user.username}</p></div><Status user={user}/></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><Info label="Plan" value={getPlanDefinition(user.plan).name}/><Info label="Smart Links" value={getPlanUsageLabel(user.plan, user.linksUsed)}/><Info label="Expires" value={formatDate(user.periodEnd)}/><Info label="Published" value={`${user.publishedLinks} public`}/></div></Link>)}</div>
    </>}
  </div>;
}

function Summary({ icon: Icon, label, value, active, onClick }: { icon: React.ElementType; label: string; value: number; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left ${active ? "border-brand-violet bg-brand-violet-strong text-white shadow-lg shadow-brand-violet/15" : "border-zinc-200 bg-white"}`}><Icon size={18}/><p className="mt-4 text-2xl font-bold">{value}</p><p className={`mt-1 text-xs ${active ? "text-white" : "text-zinc-500"}`}>{label}</p></button>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl bg-zinc-50 p-3"><p className="text-zinc-400">{label}</p><p className="mt-1 break-words font-semibold text-zinc-800">{value}</p></div>; }
function Status({ user }: { user: AdminUserListItem }) { const status = user.accountStatus === "SUSPENDED" ? "SUSPENDED" : user.accountStatus === "DISABLED" ? "STOPPED" : user.subscriptionStatus; return <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">{status.replaceAll("_", " ")}</span>; }
function effectiveStatus(user: AdminUserListItem, nowMs: number) { if (user.accountStatus === "SUSPENDED") return "SUSPENDED"; if (user.accountStatus === "DISABLED") return "STOPPED"; if (user.subscriptionStatus !== "STOPPED" && new Date(user.periodEnd).getTime() < nowMs) return "EXPIRED"; return user.subscriptionStatus; }
function isExpiringSoon(user: AdminUserListItem, nowMs: number) { if (effectiveStatus(user, nowMs) !== "ACTIVE") return false; const days = Math.ceil((new Date(user.periodEnd).getTime() - nowMs) / 86400000); return days >= 0 && days <= 7; }
function formatDate(value: string) { return formatUtcDate(value, { month: "short", day: "2-digit", year: "numeric" }); }
