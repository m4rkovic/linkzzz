import Link from "next/link";

export default function PublicProfileNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xl font-black">
          L
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Profile not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          This Linkzzz profile does not exist, was renamed, or is no longer available.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
        >
          Go to Linkzzz
        </Link>
      </div>
    </main>
  );
}
