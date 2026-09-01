import Link from "next/link";
import { BarChart3, ExternalLink, KeyRound } from "lucide-react";

import type { AdminUserModel } from "@/features/admin/admin-types";
import { getSubscriptionLabel } from "@/features/admin/subscription-rules";

export default function UserHeader({
  user,
  onResetPassword,
}: {
  user: AdminUserModel;
  onResetPassword: () => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white sm:h-16 sm:w-16">
          {user.initials}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-950">{user.displayName}</h1>
            <SubscriptionBadge status={user.subscriptionStatus} />
            <AccountBadge status={user.accountStatus} />
          </div>
          <p className="mt-1 break-words text-sm text-zinc-500">@{user.username} · {user.email}</p>
          <p className="mt-1 text-xs text-zinc-400">Customer ID #{user.id}</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 xl:flex">
        <Link href={`/${user.slug}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
          <ExternalLink size={16} /> Public profile
        </Link>
        <Link href={`/dashboard/analytics?user=${encodeURIComponent(user.slug)}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
          <BarChart3 size={16} /> Analytics
        </Link>
        <button type="button" onClick={onResetPassword} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
          <KeyRound size={16} /> Reset password
        </button>
      </div>
    </div>
  );
}

function SubscriptionBadge({ status }: { status: AdminUserModel["subscriptionStatus"] }) {
  const classes = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    CANCEL_AT_PERIOD_END: "bg-amber-50 text-amber-700",
    EXPIRED: "bg-orange-50 text-orange-700",
    STOPPED: "bg-red-50 text-red-700",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{getSubscriptionLabel(status)}</span>;
}

function AccountBadge({ status }: { status: AdminUserModel["accountStatus"] }) {
  const classes = {
    ACTIVE: "bg-zinc-100 text-zinc-600",
    SUSPENDED: "bg-red-50 text-red-700",
    DISABLED: "bg-red-100 text-red-800",
  };

  const labels = {
    ACTIVE: "Account active",
    SUSPENDED: "Suspended",
    DISABLED: "Access disabled",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{labels[status]}</span>;
}
