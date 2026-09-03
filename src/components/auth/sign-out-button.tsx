"use client";

import { useState, type ReactNode } from "react";

export default function SignOutButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      // The session cookie changed, so start the next route from a clean server
      // request instead of racing a client transition against an RSC refresh.
      window.location.replace("/login");
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? "Signing out..." : children}
    </button>
  );
}
