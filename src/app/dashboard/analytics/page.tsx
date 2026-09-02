import { redirect } from "next/navigation";

import AnalyticsDashboard from "@/components/analytics/analytics-dashboard";
import { getAnalyticsDashboard } from "@/server/analytics/analytics-service";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function AnalyticsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const data = await getAnalyticsDashboard(session.user.id);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-5 min-w-0 sm:mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Performance</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">Analytics</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Understand human traffic, destination engagement and link runtime behavior.
        </p>
      </div>

      <AnalyticsDashboard snapshots={data.snapshots} />
    </div>
  );
}
