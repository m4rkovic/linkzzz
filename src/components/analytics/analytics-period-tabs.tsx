import { ANALYTICS_PERIODS } from "@/features/analytics/analytics-periods";
import type { AnalyticsPeriod } from "@/types/analytics";

type Props = {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
};

export default function AnalyticsPeriodTabs({ value, onChange }: Props) {
  return (
    <div className="grid max-w-full grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 sm:flex sm:w-fit" role="tablist" aria-label="Analytics period">
      {ANALYTICS_PERIODS.map((period) => {
        const active = period.value === value;

        return (
          <button
            key={period.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(period.value)}
            className={`min-h-10 min-w-0 rounded-lg px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 sm:shrink-0 sm:px-4 ${
              active
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
