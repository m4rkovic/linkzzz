"use client";

import Link from "next/link";
import SignOutButton from "@/components/auth/sign-out-button";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  CircleUserRound,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Palette,
  UserRound,
  LogOut,
} from "lucide-react";

type SidebarProps = {
  onNavigate?: () => void;
};

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserRound,
  },
  {
    name: "Links",
    href: "/dashboard/links",
    icon: Link2,
  },
  {
    name: "Appearance",
    href: "/dashboard/appearance",
    icon: Palette,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar({
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-200 bg-white">
      {/* LOGO */}
      <div className="flex h-20 shrink-0 items-center px-6">
        <span className="text-xl font-black tracking-tight text-zinc-950">
          LINKZZZ
        </span>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM */}
      <div className="shrink-0 px-3 pb-3 pt-4">
        <Link
          href="/dashboard/account"
          onClick={onNavigate}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname.startsWith("/dashboard/account")
              ? "bg-zinc-950 text-white"
              : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
          }`}
        >
          <CircleUserRound size={19} />
          Account
        </Link>

        <div className="mt-3 rounded-2xl bg-zinc-950 p-4 text-white">
          <p className="text-xs font-semibold text-zinc-400">
            PREMIUM PLUS
          </p>

          <div className="mt-3 flex items-end justify-between">
            <span className="text-sm font-semibold">
              57 / 100
            </span>

            <span className="text-xs text-zinc-400">
              links
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-[57%] rounded-full bg-white" />
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Renews Sep 29, 2026
          </p>
        </div>

        <button
          type="button"
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
        >
          View profile
          <ExternalLink size={16} />
        </button>

        <SignOutButton className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-60">
          <LogOut size={18} />
          Sign out
        </SignOutButton>
      </div>
    </aside>
  );
}