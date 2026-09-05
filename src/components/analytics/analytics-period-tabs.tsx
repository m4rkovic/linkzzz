"use client";

import { useRef, type KeyboardEvent } from "react";

import { ANALYTICS_PERIODS } from "@/features/analytics/analytics-periods";
import type { AnalyticsPeriod } from "@/types/analytics";

type Props = {
  value: AnalyticsPeriod;
  onChange: (value: AnalyticsPeriod) => void;
};

export default function AnalyticsPeriodTabs({ value, onChange }: Props) {
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  function activate(index: number) {
    const period = ANALYTICS_PERIODS[index];
    if (!period) return;
    onChange(period.value);
    tabsRef.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % ANALYTICS_PERIODS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + ANALYTICS_PERIODS.length) % ANALYTICS_PERIODS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ANALYTICS_PERIODS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    activate(nextIndex);
  }

  return (
    <div className="grid max-w-full grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 sm:flex sm:w-fit" role="tablist" aria-label="Analytics period">
      {ANALYTICS_PERIODS.map((period, index) => {
        const active = period.value === value;

        return (
          <button
            key={period.value}
            ref={(element) => { tabsRef.current[index] = element; }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(period.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`min-h-10 min-w-0 rounded-lg px-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/25 sm:shrink-0 sm:px-4 ${
              active
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-zinc-600 hover:text-zinc-950"
            }`}
          >
            {period.label}
          </button>
        );
      })}
    </div>
  );
}
