"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function SignOutButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();
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
      router.replace("/login");
      router.refresh();
      setLoading(false);
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
