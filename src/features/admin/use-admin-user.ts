"use client";

import { useCallback, useEffect, useState } from "react";
import { createMockAdminUser } from "@/features/admin/mock-admin-user";
import type { AdminHistoryItem, AdminPlan, AdminProfileStatus, AdminUserModel } from "@/features/admin/admin-types";
import type { AdminUserAction, AdminUserSnapshot } from "@/types/admin-api";

function hydrateUser(user: AdminUserSnapshot): AdminUserModel {
  return { ...user, periodStart: new Date(user.periodStart), periodEnd: new Date(user.periodEnd) };
}

export function useAdminUser(userId: string) {
  const [user, setUser] = useState<AdminUserModel>(() => createMockAdminUser(userId));
  const [history, setHistory] = useState<AdminHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load customer.");
      setUser(hydrateUser(body.user));
      setHistory(body.history);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load customer.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function action(payload: AdminUserAction) {
    setError("");
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) {
      const message = body.error ?? "Admin action failed.";
      setError(message);
      throw new Error(message);
    }
    setUser(hydrateUser(body.user));
    setHistory(body.history);
    return body as { temporaryPassword?: string };
  }

  return {
    user, history, loading, error, reload: load,
    renewSubscription: (months: number) => void action({ type: "RENEW", months: months as 1 | 3 | 6 | 12 }),
    stopRenewal: () => void action({ type: "STOP_RENEWAL" }),
    resumeRenewal: () => void action({ type: "RESUME_RENEWAL" }),
    stopImmediately: () => void action({ type: "STOP_IMMEDIATELY" }),
    changePlan: (plan: AdminPlan) => void action({ type: "CHANGE_PLAN", plan }),
    setProfileStatus: (status: AdminProfileStatus) => {
      if (status === "DRAFT") return;
      void action({ type: "SET_PROFILE_STATUS", status });
    },
    changeSlug: (slug: string) => void action({ type: "CHANGE_SLUG", slug }),
    suspendAccount: (reason: string) => void action({ type: "SUSPEND", reason }),
    reactivateAccount: () => void action({ type: "REACTIVATE" }),
    resetPassword: async () => (await action({ type: "RESET_PASSWORD" })).temporaryPassword ?? "",
  };
}
