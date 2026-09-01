import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { ProfileProvider } from "@/features/profile/profile-context";
import { getCurrentSession } from "@/server/auth/current-session";
import { getOrCreateProfileForUser } from "@/server/profile/profile-service";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (session.principal.role === "ADMIN") {
    redirect("/admin");
  }

  const profile = await getOrCreateProfileForUser(session.user.id);

  if (!profile) {
    throw new Error("Customer profile could not be loaded.");
  }

  return (
    <ProfileProvider initialProfile={profile}>
      <DashboardShell>{children}</DashboardShell>
    </ProfileProvider>
  );
}
