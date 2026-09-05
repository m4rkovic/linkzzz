import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import LandingPage from "@/components/landing/landing-page";
import {
  getRequestHostname,
  isApplicationHostname,
} from "@/server/domains/host-routing";
import {
  buildPublicSmartLinkMetadata,
  renderSmartLinkRuntime,
  resolveCachedActiveCustomDomain,
} from "@/server/smart-links/public-runtime";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = getRequestHostname(requestHeaders);
  if (!host || isApplicationHostname(host)) return {};

  const slug = await resolveCachedActiveCustomDomain(host);
  return buildPublicSmartLinkMetadata(slug);
}

export default async function Home() {
  const requestHeaders = await headers();
  const host = getRequestHostname(requestHeaders);

  if (host && !isApplicationHostname(host)) {
    const slug = await resolveCachedActiveCustomDomain(host);
    if (!slug) notFound();
    return renderSmartLinkRuntime(slug, requestHeaders);
  }

  return <LandingPage />;
}
