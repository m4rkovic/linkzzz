import UsersDashboard from "@/components/admin/users-dashboard";
import { listAdminUsers } from "@/server/admin/admin-service";
import { getCurrentSession } from "@/server/auth/current-session";
import { getServerRenderTimestamp } from "@/server/time/server-clock";
import { redirect } from "next/navigation";

type QuickView = "ALL" | "EXPIRING" | "CANCELLING" | "EXPIRED";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.principal.role !== "ADMIN") redirect("/dashboard");

  const [{ view }, users] = await Promise.all([searchParams, listAdminUsers()]);
  const initialView = parseQuickView(Array.isArray(view) ? view[0] : view);

  return (
    <UsersDashboard
      initialUsers={users}
      initialView={initialView}
      nowMs={getServerRenderTimestamp()}
    />
  );
}

function parseQuickView(value: string | undefined): QuickView {
  switch (value?.toUpperCase()) {
    case "EXPIRING":
      return "EXPIRING";
    case "CANCELLING":
      return "CANCELLING";
    case "EXPIRED":
      return "EXPIRED";
    default:
      return "ALL";
  }
}
