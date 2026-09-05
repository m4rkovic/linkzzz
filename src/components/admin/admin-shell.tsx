"use client";

import { useState } from "react";
import { X } from "lucide-react";

import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminTopbar from "@/components/admin/admin-topbar";
import { DialogShell } from "@/components/ui/dialog";
import { ToastProvider } from "@/components/ui/toast";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-dvh w-full max-w-full overflow-x-clip bg-zinc-50 xl:pl-64">
        <div className="fixed inset-y-0 left-0 z-40 hidden w-64 xl:block">
          <AdminSidebar />
        </div>

        <DialogShell
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ariaLabel="Admin navigation"
          overlayClassName="z-50 xl:hidden !items-stretch !justify-start !p-0 sm:!items-stretch sm:!p-0"
          panelClassName="h-full !w-[min(84vw,320px)] max-w-[calc(100vw-2rem)] shadow-2xl"
        >
          <div className="relative h-full">
            <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-violet/30"
              aria-label="Close admin navigation"
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>
        </DialogShell>

        <div className="min-h-dvh w-full min-w-0 max-w-full">
          <AdminTopbar onMenuClick={() => setMobileMenuOpen(true)} />

          <main className="w-full min-w-0 max-w-full overflow-x-clip px-3 py-4 sm:px-5 sm:py-6 md:px-6 xl:px-8 xl:py-8">
            <div className="w-full min-w-0 max-w-full">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
