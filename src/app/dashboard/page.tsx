import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  Eye,
  FileText,
  Link2,
  MousePointerClick,
  Plus,
  Route,
  Users,
} from "lucide-react";

import { getPlanDefinition } from "@/features/plans/plan-catalog";
import { buildSmartLinkDashboardMetrics } from "@/features/smart-links/dashboard-metrics";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { cardClassName } from "@/components/ui/card";
import { getCurrentSession } from "@/server/auth/current-session";
import { getServerDependencies } from "@/server/persistence/dependencies";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const dependencies = await getServerDependencies();
  const [links, subscription, events] = await Promise.all([
    dependencies.smartLinks.listForUser(session.user.id),
    dependencies.subscriptions.findByUserId(session.user.id),
    dependencies.analytics?.listForUser(session.user.id) ?? Promise.resolve([]),
  ]);

  const metrics = buildSmartLinkDashboardMetrics(events);
  const views = [...metrics.values()].reduce((sum, item) => sum + item.views, 0);
  const clicks = [...metrics.values()].reduce((sum, item) => sum + item.clicks, 0);
  const visitorIds = new Set(
    events
      .filter((event) => !event.isBot && (event.type === "SMART_LINK_VIEW" || event.type === "PAGE_VIEW"))
      .map((event) => event.visitorId)
      .filter((value): value is string => Boolean(value)),
  );
  const uniqueVisitors = visitorIds.size;
  const published = links.filter((link) => link.status === "PUBLISHED").length;
  const ctr = views > 0 ? (clicks / views) * 100 : 0;
  const recentLinks = [...links]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);
  const plan = subscription ? getPlanDefinition(subscription.plan) : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Workspace</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Overview</h1>
          <p className="mt-2 text-sm text-zinc-500">Your Smart Links, traffic and current workspace status at a glance.</p>
        </div>
        <Link
          href="/dashboard/links"
          className={buttonClassName({ variant: "primary", className: "w-full font-black sm:w-auto" })}
        >
          <Plus size={17} /> Create Smart Link
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Link2} label="Total Smart Links" value={links.length.toLocaleString("en-US")} detail={`${published} published`} />
        <Kpi icon={Eye} label="Views" value={views.toLocaleString("en-US")} detail="Across all Smart Links" />
        <Kpi icon={MousePointerClick} label="Clicks" value={clicks.toLocaleString("en-US")} detail={`${ctr.toFixed(1)}% CTR`} />
        <Kpi icon={Users} label="Unique visitors" value={uniqueVisitors.toLocaleString("en-US")} detail="Pseudonymous visitors" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <section className={cardClassName({ padding: "none", className: "overflow-hidden" })}>
          <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="font-bold text-zinc-950">Recent Smart Links</h2>
              <p className="mt-1 text-xs text-zinc-500">Jump back into your most recently edited Smart Links.</p>
            </div>
            <Link href="/dashboard/links" className="text-sm font-bold text-zinc-600 hover:text-zinc-950">View all</Link>
          </div>

          {recentLinks.length ? (
            <div className="divide-y divide-zinc-100">
              {recentLinks.map((link) => {
                const Icon = link.type === "LANDING_PAGE" ? FileText : Route;
                const linkMetrics = metrics.get(link.id) ?? { views: 0, clicks: 0 };
                return (
                  <Link
                    key={link.id}
                    href={`/dashboard/links/${link.id}`}
                    className="flex min-w-0 items-center gap-3 px-5 py-4 transition hover:bg-zinc-50 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong"><Icon size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-zinc-950">{link.title}</p>
                        <Status status={link.status} />
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">/{link.slug}</p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-xs font-bold text-zinc-700">{linkMetrics.views.toLocaleString("en-US")} views</p>
                      <p className="mt-1 text-[11px] text-zinc-400">{linkMetrics.clicks.toLocaleString("en-US")} clicks</p>
                    </div>
                    <ArrowUpRight size={16} className="shrink-0 text-zinc-400" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center sm:px-6">
              <Link2 size={26} className="mx-auto text-zinc-300" />
              <p className="mt-3 text-sm font-bold text-zinc-800">No Smart Links yet</p>
              <p className="mt-1 text-xs text-zinc-500">Create a Landing Page or Direct Smart Link to get started.</p>
            </div>
          )}
        </section>

        <section className={cardClassName({ padding: "lg" })}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Current plan</p>
          {plan ? (
            <>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-zinc-950">{plan.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">${plan.priceUsdMonthly} / month</p>
              <div className="mt-6 space-y-3">
                <PlanRow label="Smart Links" value={plan.smartLinkDisplay} />
                <PlanRow label="Links per Landing Page" value={String(plan.pageLinkLimit)} />
                <PlanRow label="Subscription" value={subscription?.status === "ACTIVE" ? "Active" : subscription?.status.replaceAll("_", " ") ?? "—"} />
              </div>
              <Link href="/dashboard/plans" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50">
                View plans
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No active plan is attached to this account.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, detail }: { icon: typeof BarChart3; label: string; value: string; detail: string }) {
  return (
    <section className={cardClassName()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-zinc-950">{value}</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong"><Icon size={19} /></div>
      </div>
      <p className="mt-4 text-xs text-zinc-400">{detail}</p>
    </section>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-bold text-zinc-900">{value}</span>
    </div>
  );
}

function Status({ status }: { status: "DRAFT" | "PUBLISHED" | "DISABLED" }) {
  const tone = status === "PUBLISHED"
    ? "success"
    : status === "DISABLED"
      ? "danger"
      : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
