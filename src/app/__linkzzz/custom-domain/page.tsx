import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  CUSTOM_DOMAIN_RUNTIME_HOST_HEADER,
  getRequestHostname,
  isApplicationHostname,
  normalizeRequestHostname,
} from "@/server/domains/host-routing";
import {
  buildPublicSmartLinkMetadata,
  renderSmartLinkRuntime,
  resolveCachedActiveCustomDomain,
} from "@/server/smart-links/public-runtime";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = getCustomDomainRuntimeHost(requestHeaders);
  if (!host) {
    return {
      title: { absolute: "Profile not found | Linkzzz" },
      robots: { index: false, follow: false },
    };
  }

  const slug = await resolveCachedActiveCustomDomain(host);
  return buildPublicSmartLinkMetadata(slug);
}

export default async function CustomDomainHome() {
  const requestHeaders = await headers();
  const host = getCustomDomainRuntimeHost(requestHeaders);
  if (!host) notFound();

  const slug = await resolveCachedActiveCustomDomain(host);
  if (!slug) notFound();

  return renderSmartLinkRuntime(slug, requestHeaders);
}

function getCustomDomainRuntimeHost(requestHeaders: Headers) {
  const preservedHost = normalizeRequestHostname(
    requestHeaders.get(CUSTOM_DOMAIN_RUNTIME_HOST_HEADER),
  );
  if (preservedHost && !isApplicationHostname(preservedHost)) {
    return preservedHost;
  }

  const requestHost = getRequestHostname(requestHeaders);
  return requestHost && !isApplicationHostname(requestHost) ? requestHost : null;
}
