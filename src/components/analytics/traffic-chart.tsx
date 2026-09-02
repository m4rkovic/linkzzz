"use client";

import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrafficPoint } from "@/types/analytics";

type Props = {
  data: TrafficPoint[];
};

export default function TrafficChart({ data }: Props) {
  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-brand-violet-strong" />
            <h2 className="text-lg font-semibold text-zinc-950">Traffic</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Human visits, pseudonymous unique visitors and destination clicks.</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-zinc-500">
          <ChartLegend label="Visits" className="bg-zinc-950" />
          <ChartLegend label="Unique" className="bg-brand-violet-strong" />
          <ChartLegend label="Clicks" className="bg-brand-lime-strong" />
        </div>
      </div>

      <div className="mt-6 h-[260px] min-w-0 sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="analyticsVisitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#18181b" stopOpacity={0.16} />
                <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={18}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e4e4e7",
                fontSize: "12px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              }}
            />
            <Area type="monotone" dataKey="visits" stroke="#18181b" strokeWidth={2} fill="url(#analyticsVisitsGradient)" />
            <Area type="monotone" dataKey="unique" stroke="var(--linkzzz-violet-strong)" strokeWidth={2} fillOpacity={0} />
            <Area type="monotone" dataKey="clicks" stroke="var(--linkzzz-lime-strong)" strokeWidth={2} fillOpacity={0} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function ChartLegend({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      <span>{label}</span>
    </div>
  );
}
