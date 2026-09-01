"use client";

import { useState } from "react";
import { X } from "lucide-react";

import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminTopbar from "@/components/admin/admin-topbar";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-zinc-50 xl:pl-64">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 xl:block">
        <AdminSidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          />

          <div className="relative h-full w-[min(84vw,320px)] shadow-2xl">
            <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800"
              aria-label="Close admin navigation"
            >
              <X size={19} />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-dvh w-full min-w-0 max-w-full">
        <AdminTopbar onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="w-full min-w-0 max-w-full overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 md:px-6 xl:px-8 xl:py-8">
          <div className="w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
