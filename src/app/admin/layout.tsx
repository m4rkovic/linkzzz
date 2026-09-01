import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/admin-shell";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.principal.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
