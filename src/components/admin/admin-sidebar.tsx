"use client";

import Link from "next/link";
import SignOutButton from "@/components/auth/sign-out-button";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

type AdminSidebarProps = {
  onNavigate?: () => void;
};

const navigation = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
];

export default function AdminSidebar({
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-zinc-800 bg-zinc-950 text-white">
      {/* LOGO */}
      <div className="flex h-20 shrink-0 items-center border-b border-zinc-800 px-6">
        <div>
          <p className="text-xl font-black tracking-tight">
            LINKZZZ
          </p>

          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Administration
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active
                ? "bg-white text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* ADMIN INFO */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <div className="mb-3 rounded-2xl bg-zinc-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-950">
              AD
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Administrator
              </p>

              <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                <ShieldCheck size={12} />
                ADMIN
              </div>
            </div>
          </div>
        </div>

        <SignOutButton className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white disabled:opacity-60">
          <LogOut size={18} />
          Sign out
        </SignOutButton>
      </div>
    </aside>
  );
}