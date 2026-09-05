"use client";

import { Menu } from "lucide-react";
import LinkzzzBrand from "@/components/ui/linkzzz-brand";

type TopbarProps = {
  onMenuClick: () => void;
  username: string;
};

export default function Topbar({ onMenuClick, username }: TopbarProps) {
  const initials = username
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LZ";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 w-full min-w-0 max-w-full items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-3 backdrop-blur sm:px-5 md:px-6 xl:min-h-20 xl:px-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/20 xl:hidden"
          aria-label="Open navigation"
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="xl:hidden">
          <LinkzzzBrand href="/dashboard" />
        </div>

        <div className="hidden min-w-0 xl:block">
          <p className="text-sm text-zinc-500">Workspace</p>
          <h1 className="truncate font-semibold text-zinc-950">@{username}</h1>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-sm font-semibold text-zinc-900">@{username}</p>
          <p className="truncate text-xs text-zinc-500">Linkzzz workspace</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white ring-2 ring-brand-lime/40" aria-label={`Signed in as ${username}`}>
          {initials}
        </div>
      </div>
    </header>
  );
}
