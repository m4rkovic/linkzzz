"use client";

import {
  Bell,
  ExternalLink,
  Menu,
} from "lucide-react";

type TopbarProps = {
  onMenuClick: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full min-w-0 max-w-full items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-3 backdrop-blur sm:px-5 md:px-6 xl:min-h-20 xl:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 xl:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0 xl:hidden">
          <p className="truncate text-base font-black tracking-tight text-zinc-950">
            LINKZZZ
          </p>
        </div>

        <div className="hidden min-w-0 xl:block">
          <p className="text-sm text-zinc-500">Welcome back</p>
          <h1 className="truncate font-semibold text-zinc-950">Sky Hook</h1>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden min-h-10 items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 lg:flex"
        >
          View profile
          <ExternalLink size={16} />
        </button>

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-950"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-sm font-semibold text-zinc-900">skyhook</p>
          <p className="truncate text-xs text-zinc-500">Premium Plus</p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white">
          SH
        </div>
      </div>
    </header>
  );
}
