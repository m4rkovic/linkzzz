import { ShieldAlert, ShieldCheck } from "lucide-react";

import type { AdminUserModel } from "@/features/admin/admin-types";

export default function UserAccountCard({
  user,
  onSuspend,
  onReactivate,
}: {
  user: AdminUserModel;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  const active = user.accountStatus === "ACTIVE";

  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {active ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-zinc-950">Account access</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {active ? "Customer can currently sign in to Linkzzz." : "Customer access is currently blocked. Data remains preserved."}
            </p>
          </div>
        </div>

        {active ? (
          <button type="button" onClick={onSuspend} className="min-h-11 w-full rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto">
            Suspend account
          </button>
        ) : (
          <button type="button" onClick={onReactivate} className="min-h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto">
            Reactivate account
          </button>
        )}
      </div>
    </section>
  );
}
