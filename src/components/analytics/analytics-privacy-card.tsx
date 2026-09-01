import { ShieldCheck } from "lucide-react";

export default function AnalyticsPrivacyCard() {
  return (
    <section className="w-full min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
          <ShieldCheck size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-950">Analytics privacy</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Visitor location is approximate and network-based. Linkzzz does not request precise GPS location for analytics.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-800">Bot filtering</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Known bots, crawlers and social preview requests are excluded where they can be reliably identified.
        </p>
      </div>
    </section>
  );
}
