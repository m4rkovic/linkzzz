"use client";

import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import LinkzzzBrand from "@/components/ui/linkzzz-brand";

type AdminTopbarProps = {
  onMenuClick: () => void;
};

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full min-w-0 max-w-full items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-3 backdrop-blur sm:px-5 md:px-6 xl:min-h-20 xl:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 xl:hidden"
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>

        <LinkzzzBrand href="/admin" />

        <div className="hidden h-9 w-px shrink-0 bg-zinc-200 xl:block" aria-hidden="true" />
        <div className="hidden min-w-0 xl:block">
          <p className="text-sm text-zinc-500">Administration</p>
          <h1 className="truncate font-semibold text-zinc-950">Linkzzz Control Panel</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/admin/users/new"
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:px-4"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">Create user</span>
        </Link>
      </div>
    </header>
  );
}
