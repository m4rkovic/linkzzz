import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/login-form";
import { getCurrentSession } from "@/server/auth/current-session";

type LoginPageProps = {
  searchParams: Promise<{ passwordChanged?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, query] = await Promise.all([
    getCurrentSession({ allowPasswordChangeRequired: true }),
    searchParams,
  ]);

  if (session?.principal.accountStatus === "ACTIVE") {
    if (session.mustChangePassword) redirect("/change-password");
    redirect(session.principal.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <LoginForm
      notice={
        query.passwordChanged === "1"
          ? "Password changed. Sign in again with your new password."
          : undefined
      }
    />
  );
}
