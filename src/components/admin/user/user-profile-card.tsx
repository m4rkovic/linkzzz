import Link from "next/link";
import { ExternalLink, Link2, Pencil } from "lucide-react";

import type { AdminUserModel } from "@/features/admin/admin-types";

export default function UserProfileCard({
  user,
  onChangeSlug,
  onToggleProfile,
}: {
  user: AdminUserModel;
  onChangeSlug: () => void;
  onToggleProfile: () => void;
}) {
  const published = user.profileStatus === "PUBLISHED";

  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-950">Public profile</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {published ? "Published" : user.profileStatus === "DRAFT" ? "Draft" : "Disabled"}
            </span>
          </div>
          <p className="mt-1 break-all text-sm text-zinc-500">linkzzz.com/{user.slug}</p>
        </div>

        <Link href={`/${user.slug}`} target="_blank" rel="noreferrer" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto">
          <ExternalLink size={16} /> Open profile
        </Link>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onChangeSlug} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
          <Pencil size={16} /> Change slug
        </button>
        <button type="button" onClick={onToggleProfile} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
          <Link2 size={16} /> {published ? "Disable public profile" : "Enable public profile"}
        </button>
      </div>
    </section>
  );
}
