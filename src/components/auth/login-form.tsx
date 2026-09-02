"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-control";

type LoginResponse = {
  ok?: boolean;
  role?: "CUSTOMER" | "ADMIN";
  mustChangePassword?: boolean;
  error?: string;
};

export default function LoginForm({ notice }: { notice?: string }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Enter your username or email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          rememberMe,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as LoginResponse;

      if (!response.ok || !payload.ok || !payload.role) {
        setError(payload.error ?? "Unable to sign in.");
        return;
      }

      const destination = payload.mustChangePassword
        ? "/change-password"
        : payload.role === "ADMIN"
          ? "/admin"
          : "/dashboard";

      // Authentication changes the server-visible session cookie. A full document
      // navigation is intentionally used here so the next protected route is
      // rendered against the new auth state without an overlapping RSC refresh.
      window.location.replace(destination);
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <section className="relative hidden w-[46%] overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full border border-brand-violet/30" />
        <div className="absolute -left-8 top-52 h-96 w-96 rounded-full border border-brand-lime/20" />
        <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-brand-violet/10 blur-2xl" />

        <div className="relative z-10">
          <p className="flex items-center gap-2 text-2xl font-black tracking-tight">LINKZZZ <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-brand-lime" /></p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Profile platform
          </p>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-violet">
            Your profile. Your audience.
          </p>

          <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight">
            One place for everything you want people to find.
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-zinc-400">
            Manage Smart Links, customize your public pages and understand how your
            audience interacts with it.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-3">
            <FeatureStat value="100+" label="Smart Links" />
            <FeatureStat value="Live" label="analytics" />
            <FeatureStat value="Geo" label="insights" />
          </div>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          Linkzzz administration platform
        </p>
      </section>

      <main className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8 lg:hidden">
          <p className="text-xl font-black tracking-tight text-zinc-950">LINKZZZ</p>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div>
              <p className="text-sm font-semibold text-zinc-500">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
                Sign in to Linkzzz
              </h1>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Enter the credentials provided by your Linkzzz administrator.
              </p>
            </div>

            {notice && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800"
              >
                {notice}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="identifier" className="text-sm font-medium text-zinc-900">
                  Username or email
                </label>

                <div className="relative mt-2">
                  <UserRound
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    placeholder="username"
                    className="h-12 pl-10 pr-4"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium text-zinc-900">
                  Password
                </label>

                <div className="relative mt-2">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-12 pl-10 pr-12"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={showPassword ? "Hide characters" : "Show characters"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 accent-brand-violet"
                  />
                  <span className="text-sm text-zinc-600">Remember me</span>
                </label>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={!hydrated || loading}
                className="font-black"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={17} />}
              </Button>
            </form>

            <div className="mt-8 border-t border-zinc-100 pt-6">
              <p className="text-center text-xs leading-5 text-zinc-400">
                Can&apos;t access your account? Contact your Linkzzz administrator
                to reset your credentials.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-brand-violet/25 bg-zinc-900/60 p-4">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}
