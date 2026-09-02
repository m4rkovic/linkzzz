import { cx } from "@/lib/class-names";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("animate-pulse rounded-xl bg-zinc-200/80", className)} />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" aria-label="Loading dashboard" role="status">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-64 max-w-[70vw]" />
        <Skeleton className="h-4 w-[min(520px,90vw)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
      </div>
      <Skeleton className="h-64 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
