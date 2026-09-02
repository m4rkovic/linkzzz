import { redirect } from "next/navigation";

import { getCurrentSession } from "@/server/auth/current-session";
import { getServerDependencies } from "@/server/persistence/dependencies";

export default async function LegacyAppearancePage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const dependencies = await getServerDependencies();
  const links = await dependencies.smartLinks.listForUser(session.user.id);
  const landingPage = links.find((link) => link.type === "LANDING_PAGE");

  if (!landingPage) redirect("/dashboard/links");
  redirect(`/dashboard/links/${landingPage.id}?section=Page&page=Appearance`);
}
