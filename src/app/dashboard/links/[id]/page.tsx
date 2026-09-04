import { notFound, redirect } from "next/navigation";

import SmartLinkEditor from "@/components/smart-links/smart-link-editor";
import { getCurrentSession } from "@/server/auth/current-session";
import { getVersionedPageForSmartLink } from "@/server/profile/profile-service";
import { getPageCardLimit } from "@/server/business/plans";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getOwnSmartLink } from "@/server/smart-links/smart-link-service";
import {
  customDomainView,
  listCustomDomains,
} from "@/server/domains/custom-domain-service";

type SmartLinkEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string; page?: string }>;
};

type EditorSection = "Link" | "Page" | "Deeplink" | "Geo" | "Shield" | "Tracking";
type PageSection = "Profile" | "Appearance" | "Cards" | "Blocks";

const editorSections = new Set<EditorSection>(["Link", "Page", "Deeplink", "Geo", "Shield", "Tracking"]);
const pageSections = new Set<PageSection>(["Profile", "Appearance", "Cards", "Blocks"]);

export default async function SmartLinkEditorPage({ params, searchParams }: SmartLinkEditorPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const smartLink = await getOwnSmartLink(session, id);
  if (!smartLink) notFound();

  const dependencies = await getServerDependencies();
  const [page, subscription, domains] = await Promise.all([
    smartLink.type === "LANDING_PAGE"
      ? getVersionedPageForSmartLink(session, smartLink.id)
      : Promise.resolve(undefined),
    dependencies.subscriptions.findByUserId(session.user.id),
    listCustomDomains(session.user.id, smartLink.id),
  ]);
  const pageLinkLimit = subscription ? getPageCardLimit(subscription.plan) : 0;
  if (smartLink.type === "LANDING_PAGE" && !page) notFound();

  const requestedSection = editorSections.has(query.section as EditorSection)
    ? query.section as EditorSection
    : "Link";
  const initialSection = requestedSection === "Page" && smartLink.type !== "LANDING_PAGE"
    ? "Link"
    : requestedSection;
  const initialPageSection = pageSections.has(query.page as PageSection)
    ? query.page as PageSection
    : "Profile";

  return (
    <SmartLinkEditor
      initialSmartLink={{
        ...smartLink,
        createdAt: smartLink.createdAt.toISOString(),
        updatedAt: smartLink.updatedAt.toISOString(),
      }}
      initialPage={page ?? undefined}
      initialSection={initialSection}
      initialPageSection={initialPageSection}
      pageLinkLimit={pageLinkLimit}
      initialDomains={domains.map((domain) => customDomainView(domain))}
    />
  );
}
