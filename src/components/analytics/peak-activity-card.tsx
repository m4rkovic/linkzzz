import { CalendarDays, Clock3 } from "lucide-react";

import type { PeakActivity } from "@/types/analytics";

type Props = {
  data: PeakActivity;
};

export default function PeakActivityCard({ data }: Props) {
  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Peak activity</h2>
      <p className="mt-1 text-sm text-zinc-500">Strongest traffic window in the selected period, currently reported in UTC.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <ActivityItem
          icon={Clock3}
          eyebrow="Peak hour"
          title={data.hourLabel}
          description={data.hourDetail}
        />
        <ActivityItem
          icon={CalendarDays}
          eyebrow="Peak weekday"
          title={data.weekdayLabel}
          description={data.weekdayDetail}
        />
      </div>
    </section>
  );
}

function ActivityItem({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Clock3;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-zinc-50 p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-violet-strong shadow-sm ring-1 ring-zinc-200">
        <Icon size={16} />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{eyebrow}</p>
      <p className="mt-1 break-words text-base font-bold text-zinc-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}
