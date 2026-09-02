import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function SensitiveContentWarning({
  title,
  message,
  continueLabel,
  continueHref,
  backHref,
}: {
  title: string;
  message: string;
  continueLabel: string;
  continueHref: string;
  backHref: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-white">
      <section
        aria-labelledby="sensitive-content-title"
        className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/20">
          <ShieldAlert size={22} aria-hidden="true" />
        </div>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-amber-300">Content warning</p>
        <h1 id="sensitive-content-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-300">{message}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href={continueHref}
            rel="nofollow"
            className="flex min-h-12 items-center justify-center rounded-xl bg-brand-lime px-5 text-sm font-black text-zinc-950 transition hover:bg-brand-lime-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            {continueLabel}
          </Link>
          <Link
            href={backHref}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Go back
          </Link>
        </div>

        <p className="mt-5 text-xs leading-5 text-zinc-500">
          Linkzzz is showing this notice because the page owner marked this destination as sensitive.
        </p>
      </section>
    </main>
  );
}
