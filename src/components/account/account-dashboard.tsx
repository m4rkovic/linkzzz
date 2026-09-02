"use client";

import { useState } from "react";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";

import ChangePasswordModal from "@/components/account/change-password-modal";
import SubscriptionCard from "@/components/account/subscription-card";
import UsageCard from "@/components/account/usage-card";
import {
  getAccountPlanLimit,
  type AccountSummary,
} from "@/features/account/account-types";

export default function AccountDashboard({ account }: { account: AccountSummary }) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const maxLinks = getAccountPlanLimit(account.plan);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">Account</h1>
        <p className="mt-1 text-sm text-zinc-500">View your account, plan and security information.</p>
      </div>

      <SubscriptionCard account={account} />
      <UsageCard used={account.linksUsed} limit={maxLinks} />

      <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-950">Account information</h2>
        <p className="mt-1 text-sm text-zinc-500">Basic information associated with your Linkzzz account.</p>

        <div className="mt-6 divide-y divide-zinc-100">
          <AccountRow icon={UserRound} label="Username" value={account.username} />
          <AccountRow icon={Mail} label="Email" value={account.email} />
        </div>
      </section>

      <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <KeyRound size={19} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-zinc-950">Password</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-500">Use a strong password and change it if you think your account may be compromised.</p>
            </div>
          </div>

          <button type="button" onClick={() => setPasswordModalOpen(true)} className="min-h-11 w-full shrink-0 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto">
            Change password
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-zinc-500" />
          <p className="text-sm leading-6 text-zinc-600">
            Authentication, password changes and domain ownership checks are enforced by the Linkzzz server. Subscription renewals and plan changes remain administrator-managed.
          </p>
        </div>
      </section>

      <ChangePasswordModal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </div>
  );
}

function AccountRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><Icon size={17} /></div>
        <span className="text-sm font-medium text-zinc-500">{label}</span>
      </div>
      <span className="w-full break-words text-left text-sm font-semibold text-zinc-900 sm:w-auto sm:text-right">{value}</span>
    </div>
  );
}
