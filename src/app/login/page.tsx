import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/login-form";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function LoginPage() {
  const session = await getCurrentSession({
    allowPasswordChangeRequired: true,
  });

  if (session?.principal.accountStatus === "ACTIVE") {
    if (session.mustChangePassword) redirect("/change-password");
    redirect(session.principal.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return <LoginForm />;
}
