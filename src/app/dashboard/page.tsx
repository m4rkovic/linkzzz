import {
  BarChart3,
  Link2,
  MousePointerClick,
  TrendingUp,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "Total visits",
    value: "12,482",
    change: "+18.4%",
    description: "vs. previous 30 days",
    icon: BarChart3,
  },
  {
    label: "Unique visitors",
    value: "8,921",
    change: "+12.7%",
    description: "vs. previous 30 days",
    icon: Users,
  },
  {
    label: "Link clicks",
    value: "4,817",
    change: "+21.3%",
    description: "vs. previous 30 days",
    icon: MousePointerClick,
  },
  {
    label: "CTR",
    value: "38.6%",
    change: "+2.4%",
    description: "vs. previous 30 days",
    icon: TrendingUp,
  },
];

const topLinks = [
  {
    title: "Spotify",
    clicks: 1482,
  },
  {
    title: "Instagram",
    clicks: 923,
  },
  {
    title: "YouTube",
    clicks: 611,
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      {/* PAGE HEADER */}
      <div className="mb-6 min-w-0 sm:mb-8">
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
          Overview
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          See how your profile is performing.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    {stat.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                    {stat.value}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-100 p-2.5 text-zinc-700">
                  <Icon size={20} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-600">
                  {stat.change}
                </span>

                <span className="text-xs text-zinc-400">
                  {stat.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAIN GRID */}
      <div className="mt-6 grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* TRAFFIC CHART PLACEHOLDER */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-zinc-950">
                Traffic overview
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Visits and clicks over the last 30 days.
              </p>
            </div>

            <button
              type="button"
              className="w-full shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 sm:w-auto"
            >
              Last 30 days
            </button>
          </div>

          <div className="mt-6 flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50">
            <div className="text-center">
              <BarChart3
                size={28}
                className="mx-auto text-zinc-400"
              />

              <p className="mt-3 text-sm font-medium text-zinc-600">
                Traffic chart
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                We&apos;ll add the real chart next.
              </p>
            </div>
          </div>
        </section>

        {/* TOP LINKS */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-zinc-950">
                Top links
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Best performing links.
              </p>
            </div>

            <Link2
              size={20}
              className="text-zinc-400"
            />
          </div>

          <div className="mt-6 space-y-5">
            {topLinks.map((link, index) => (
              <div
                key={link.title}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-sm font-semibold text-zinc-600">
                    {index + 1}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {link.title}
                    </p>

                    <p className="text-xs text-zinc-400">
                      Link performance
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">
                    {link.clicks.toLocaleString()}
                  </p>

                  <p className="text-xs text-zinc-400">
                    clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* SECOND ROW */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* SUBSCRIPTION */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <p className="text-sm font-medium text-zinc-500">
            Subscription
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-950">
                Premium Plus
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Active until September 29, 2026
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-700">
                Links used
              </span>

              <span className="text-zinc-500">
                57 / 100
              </span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-[57%] rounded-full bg-zinc-950" />
            </div>
          </div>
        </section>

        {/* PROFILE STATUS */}
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
          <p className="text-sm font-medium text-zinc-500">
            Public profile
          </p>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-950">
                linkzzz.com/skyhook
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Your profile is currently live.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Published
            </span>
          </div>

          <button
            type="button"
            className="mt-6 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            View public profile
          </button>
        </section>
      </div>
    </div>
  );
}