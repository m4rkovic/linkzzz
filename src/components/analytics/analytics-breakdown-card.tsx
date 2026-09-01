import type { AnalyticsBreakdownItem } from "@/types/analytics";

type Props = {
  title: string;
  description: string;
  data: AnalyticsBreakdownItem[];
};

export default function AnalyticsBreakdownCard({ title, description, data }: Props) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>

      <div className="mt-6 space-y-5">
        {data.map((item) => (
          <div key={item.name} className="min-w-0">
            <div className="flex min-w-0 items-center gap-3">
              {item.prefix && <span className="shrink-0 text-xl">{item.prefix}</span>}

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-zinc-800">{item.name}</p>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <span className="text-xs text-zinc-400">{item.value}</span>
                    <span className="w-9 text-right text-xs font-semibold text-zinc-700">{item.percentage}%</span>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-950" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
