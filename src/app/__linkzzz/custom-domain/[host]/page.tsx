import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  isApplicationHostname,
  normalizeRequestHostname,
} from "@/server/domains/host-routing";
import {
  buildPublicSmartLinkMetadata,
  renderSmartLinkRuntime,
  resolveCachedActiveCustomDomain,
} from "@/server/smart-links/public-runtime";

type CustomDomainRuntimePageProps = {
  params: Promise<{ host: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CustomDomainRuntimePageProps): Promise<Metadata> {
  const host = await getRuntimeHost(params);
  if (!host) {
    return {
      title: { absolute: "Profile not found | Linkzzz" },
      robots: { index: false, follow: false },
    };
  }

  const slug = await resolveCachedActiveCustomDomain(host);
  return buildPublicSmartLinkMetadata(slug);
}

export default async function CustomDomainHome({
  params,
}: CustomDomainRuntimePageProps) {
  const host = await getRuntimeHost(params);
  if (!host) notFound();

  const slug = await resolveCachedActiveCustomDomain(host);
  if (!slug) notFound();

  return renderSmartLinkRuntime(slug, await headers());
}

async function getRuntimeHost(params: Promise<{ host: string }>) {
  const host = normalizeRequestHostname((await params).host);
  return host && !isApplicationHostname(host) ? host : null;
}
