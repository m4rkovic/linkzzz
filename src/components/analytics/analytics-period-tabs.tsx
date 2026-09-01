import { ANALYTICS_PERIODS } from "@/features/analytics/mock-analytics";
import type { AnalyticsPeriod } from "@/types/analytics";

type Props = {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
};

export default function AnalyticsPeriodTabs({ value, onChange }: Props) {
  return (
    <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max rounded-xl bg-zinc-100 p-1">
        {ANALYTICS_PERIODS.map((period) => {
          const active = period.value === value;

          return (
            <button
              key={period.value}
              type="button"
              onClick={() => onChange(period.value)}
              className={`min-h-10 rounded-lg px-3 text-xs font-semibold transition sm:px-4 ${
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
    </div>
  );
}
