import { redirect } from "next/navigation";

import ChangePasswordModal from "@/components/account/change-password-modal";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function RequiredPasswordChangePage() {
  const session = await getCurrentSession({
    allowPasswordChangeRequired: true,
  });

  if (!session) redirect("/login");
  if (!session.mustChangePassword) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-zinc-100">
      <ChangePasswordModal open forced />
    </main>
  );
}
