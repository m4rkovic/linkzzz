"use client";

import { useState } from "react";
import { X } from "lucide-react";

import Sidebar from "@/components/dashboard/sidebar";
import Topbar from "@/components/dashboard/topbar";
import { ToastProvider } from "@/components/ui/toast";

type DashboardShellProps = {
  children: React.ReactNode;
  username: string;
};

export default function DashboardShell({
  children,
  username,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-zinc-50 xl:pl-64">
      {/* DESKTOP SIDEBAR
          Keep the fixed sidebar for truly wide screens only. At 1024px the
          old lg breakpoint left too little room for editors and caused page
          overflow. */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 xl:block">
        <Sidebar />
      </div>

      {/* MOBILE / TABLET DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <div className="relative h-full w-[min(84vw,320px)] shadow-2xl">
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:bg-zinc-100"
              aria-label="Close navigation"
            >
              <X size={19} />
            </button>
          </div>
        </div>
      )}

      {/* APPLICATION */}
      <div className="min-h-dvh w-full min-w-0 max-w-full">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} username={username} />

        <main className="w-full min-w-0 max-w-full overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 md:px-6 xl:px-8 xl:py-8">
          <div className="w-full min-w-0 max-w-full">{children}</div>
        </main>
      </div>
      </div>
    </ToastProvider>
  );
}
