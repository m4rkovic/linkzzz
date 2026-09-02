"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Link2,
  LogOut,
} from "lucide-react";

import SignOutButton from "@/components/auth/sign-out-button";

type SidebarProps = {
  onNavigate?: () => void;
};

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Smart Links", href: "/dashboard/links", icon: Link2 },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Plans", href: "/dashboard/plans", icon: CreditCard },
];

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-20 shrink-0 items-center px-6">
        <span className="text-xl font-black tracking-tight text-zinc-950">LINKZZZ</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/dashboard"
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
          Settings
        </Link>

        <SignOutButton className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-60">
          <LogOut size={18} />
          Sign out
        </SignOutButton>
      </div>
    </aside>
  );
}
