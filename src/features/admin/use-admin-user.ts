"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { AdminHistoryItem, AdminPlan, AdminUserModel } from "@/features/admin/admin-types";
import type { SubscriptionRenewalMonths } from "@/server/business/subscriptions";
import type {
  AdminHistorySnapshot,
  AdminUserAction,
  AdminUserSnapshot,
} from "@/types/admin-api";

function hydrateUser(user: AdminUserSnapshot): AdminUserModel {
  return {
    ...user,
    periodStart: new Date(user.periodStart),
    periodEnd: new Date(user.periodEnd),
    smartLinks: user.smartLinks.map((smartLink) => ({
      ...smartLink,
      updatedAt: new Date(smartLink.updatedAt),
    })),
  };
}

export function useAdminUser(
  userId: string,
  initialData: { user: AdminUserSnapshot; history: AdminHistorySnapshot[] },
) {
  const { pushToast } = useToast();
  const [user, setUser] = useState<AdminUserModel>(() => hydrateUser(initialData.user));
  const [history, setHistory] = useState<AdminHistoryItem[]>(initialData.history);
  const [loading, setLoading] = useState(false);
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

  async function action(payload: AdminUserAction, successTitle: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Admin action failed.");
      setUser(hydrateUser(body.user));
      setHistory(body.history);
      pushToast({ title: successTitle, tone: "success" });
      return body as { temporaryPassword?: string };
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Admin action failed.";
      setError(message);
      pushToast({ title: "Admin action failed", description: message, tone: "error" });
      throw caught;
    }
  }

  return {
    user,
    history,
    loading,
    error,
    reload: load,
    renewSubscription: (months: SubscriptionRenewalMonths) =>
      action({ type: "RENEW", months }, "Subscription renewed"),
    stopRenewal: () => action({ type: "STOP_RENEWAL" }, "Renewal stopped"),
    resumeRenewal: () => action({ type: "RESUME_RENEWAL" }, "Renewal resumed"),
    stopImmediately: () => action({ type: "STOP_IMMEDIATELY" }, "Subscription stopped"),
    changePlan: (plan: AdminPlan) => action({ type: "CHANGE_PLAN", plan }, "Plan updated"),
    setSmartLinkStatus: (smartLinkId: string, status: "PUBLISHED" | "DISABLED") =>
      action(
        { type: "SET_SMART_LINK_STATUS", smartLinkId, status },
        status === "DISABLED" ? "Smart Link disabled" : "Smart Link restored",
      ),
    suspendAccount: (reason: string) => action({ type: "SUSPEND", reason }, "Account suspended"),
    reactivateAccount: () => action({ type: "REACTIVATE" }, "Account reactivated"),
    resetPassword: async () => (await action({ type: "RESET_PASSWORD" }, "Temporary password created")).temporaryPassword ?? "",
  };
}
