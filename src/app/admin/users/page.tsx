import {
  Suspense,
} from "react";

import UsersDashboard from "@/components/admin/users-dashboard";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <UsersDashboardFallback />
      }
    >
      <UsersDashboard />
    </Suspense>
  );
}

function UsersDashboardFallback() {
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-200" />

        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-zinc-100" />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />

          <div className="h-11 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="space-y-3 p-5">
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-100" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-36 animate-pulse rounded bg-zinc-100" />

                  <div className="mt-2 h-3 w-48 max-w-full animate-pulse rounded bg-zinc-100" />
                </div>

                <div className="hidden h-8 w-20 animate-pulse rounded-full bg-zinc-100 sm:block" />

                <div className="hidden h-8 w-24 animate-pulse rounded-full bg-zinc-100 md:block" />
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}