import AnalyticsDashboard from "@/components/analytics/analytics-dashboard";
import { getAnalyticsSnapshots } from "@/server/analytics/analytics-service";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function AnalyticsPage() {
    const session = await getCurrentSession();
    if (!session) return null;
    const snapshots = await getAnalyticsSnapshots(session.user.id);
    return (
        <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-5 min-w-0 sm:mb-6">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                    Analytics
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                    Track visits, clicks and audience activity on your public profile.
                </p>
            </div>

            <AnalyticsDashboard snapshots={snapshots} />
        </div>
    );
}
