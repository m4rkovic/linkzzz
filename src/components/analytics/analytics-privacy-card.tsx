import { ShieldCheck } from "lucide-react";

export default function AnalyticsPrivacyCard() {
  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-violet-soft text-brand-violet-strong">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-950">Analytics privacy</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Location is approximate and network-based. Linkzzz does not request precise GPS location for analytics.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-800">Human traffic first</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Bots and blocked automated traffic are excluded from Visits, Unique visitors, CTR and audience breakdowns. Shield blocks are reported separately.
          </p>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-800">Pseudonymous uniques</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Visitor identifiers are privacy-preserving and may rotate, so multi-day unique visitor counts are an approximation rather than identity tracking.
          </p>
        </div>
      </div>
    </section>
  );
}
