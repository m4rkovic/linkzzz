import { redirect } from "next/navigation";

import DashboardShell from "@/components/dashboard/dashboard-shell";
import { ProfileProvider } from "@/features/profile/profile-context";
import { getCurrentSession } from "@/server/auth/current-session";
import { getOrCreateVersionedProfileForUser } from "@/server/profile/profile-service";

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

  const profileRecord = await getOrCreateVersionedProfileForUser(session.user.id);

  if (!profileRecord) {
    throw new Error("Customer profile could not be loaded.");
  }

  return (
    <ProfileProvider
      initialProfile={profileRecord.profile}
      initialRevision={profileRecord.revision}
    >
      <DashboardShell>{children}</DashboardShell>
    </ProfileProvider>
  );
}
