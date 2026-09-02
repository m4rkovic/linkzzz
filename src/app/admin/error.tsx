"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[55vh] w-full max-w-2xl items-center justify-center px-2">
      <div className="w-full rounded-3xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700"><AlertTriangle size={22} /></div>
        <h1 className="mt-4 text-xl font-black tracking-tight text-zinc-950">Admin page could not be loaded</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">No admin action was applied by this error. Retry the page before repeating any write operation.</p>
        <Button variant="secondary" onClick={reset} className="mt-5"><RotateCcw size={16} /> Try again</Button>
      </div>
    </div>
  );
}
