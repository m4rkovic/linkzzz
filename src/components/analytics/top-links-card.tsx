import type { TopLinkAnalytics } from "@/types/analytics";

type Props = {
  links: TopLinkAnalytics[];
};

export default function TopLinksCard({ links }: Props) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Top links</h2>
      <p className="mt-1 text-sm text-zinc-500">Links receiving the most clicks.</p>

      <div className="mt-6 space-y-5">
        {links.map((link, index) => (
          <div key={`${link.name}-${link.url}`} className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xs font-bold text-zinc-600">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{link.name}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-400">{link.url}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-zinc-900">{link.clicks.toLocaleString()}</p>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-zinc-950" style={{ width: `${link.percentage}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
