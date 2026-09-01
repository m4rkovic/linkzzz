import type { AdminHistoryItem } from "@/features/admin/admin-types";

export default function SubscriptionHistory({ history }: { history: AdminHistoryItem[] }) {
  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-950">Administrative history</h2>
      <p className="mt-1 text-sm text-zinc-500">Server audit trail for subscription, profile and account changes.</p>

      <div className="mt-6">
        {history.map((item, index) => (
          <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index !== history.length - 1 && <div className="absolute left-[7px] top-5 h-full w-px bg-zinc-200" />}
            <div className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[4px] border-white bg-zinc-950 ring-1 ring-zinc-200" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-400">{item.date}</p>
              <p className="mt-2 text-sm leading-5 text-zinc-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
