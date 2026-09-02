import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) redirect("/login");
  if (session.principal.role === "ADMIN") redirect("/admin");

  return (
    <DashboardShell username={session.user.username}>
      {children}
    </DashboardShell>
  );
}
