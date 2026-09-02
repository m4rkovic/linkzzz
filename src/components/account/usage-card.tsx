export default function UsageCard({
  used,
  limit,
}: {
  used: number;
  limit: number;
}) {
  const percentage = Math.min((used / limit) * 100, 100);
  const overLimit = used > limit;

  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-zinc-950">Smart Link usage</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Your current plan allows up to {limit} Smart Links.
          </p>
        </div>

        <p className={`text-sm font-bold ${overLimit ? "text-red-600" : "text-zinc-950"}`}>
          {used} / {limit}
        </p>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-all ${overLimit ? "bg-red-600" : "bg-zinc-950"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {overLimit && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
          Existing Smart Links stay intact, but creating new Smart Links is blocked until usage falls below the plan limit.
        </p>
      )}
    </section>
  );
}
