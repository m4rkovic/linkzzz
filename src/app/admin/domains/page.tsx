import { redirect } from "next/navigation";

import AdminCustomDomains from "@/components/admin/admin-custom-domains";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  customDomainView,
  listCustomDomainsForAdmin,
} from "@/server/domains/custom-domain-service";

export default async function AdminDomainsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.principal.role !== "ADMIN") redirect("/dashboard");

  const domains = await listCustomDomainsForAdmin();

  return (
    <AdminCustomDomains
      initialDomains={domains.map((domain) => ({
        ...customDomainView(domain),
        ownerUserId: domain.ownerUserId,
        ownerUsername: domain.ownerUsername,
        smartLinkTitle: domain.smartLinkTitle,
        smartLinkSlug: domain.smartLinkSlug,
      }))}
    />
  );
}
