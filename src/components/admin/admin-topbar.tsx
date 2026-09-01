"use client";

import Link from "next/link";
import { Bell, Menu, Plus } from "lucide-react";

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

        <div className="min-w-0 xl:hidden">
          <p className="truncate text-base font-black tracking-tight text-zinc-950">LINKZZZ</p>
          <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-zinc-400 sm:block">Admin</p>
        </div>

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

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
