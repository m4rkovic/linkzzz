import { Bot, ExternalLink, RotateCcw, ShieldCheck } from "lucide-react";

import type { AnalyticsRuntimeHealth } from "@/types/analytics";

export default function AnalyticsRuntimeCard({ data }: { data: AnalyticsRuntimeHealth }) {
  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Link runtime</h2>
      <p className="mt-1 text-sm text-zinc-500">Signals from Deeplink and Traffic Shield behavior.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <RuntimeMetric icon={ExternalLink} label="Deeplink attempts" value={data.deeplinkAttempts.toLocaleString("en-US")} />
        <RuntimeMetric icon={RotateCcw} label="Fallbacks" value={data.deeplinkFallbacks.toLocaleString("en-US")} />
        <RuntimeMetric icon={Bot} label="Fallback rate" value={`${data.deeplinkFallbackRate.toFixed(1)}%`} />
        <RuntimeMetric icon={ShieldCheck} label="Shield blocks" value={data.shieldBlocks.toLocaleString("en-US")} />
      </div>

      <p className="mt-5 text-xs leading-5 text-zinc-400">
        Fallback rate measures recorded fallbacks after Deeplink helper attempts. It is not an app-open success rate.
      </p>
    </section>
  );
}

function RuntimeMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ExternalLink;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-brand-violet-strong ring-1 ring-zinc-200">
          <Icon size={15} />
        </div>
        <span className="text-xl font-black tracking-tight text-zinc-950">{value}</span>
      </div>
      <p className="mt-3 text-xs font-semibold text-zinc-500">{label}</p>
    </div>
  );
}
