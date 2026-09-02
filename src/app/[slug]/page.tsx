import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import DeeplinkHelper from "@/components/public/deeplink-helper";
import { recordSmartLinkRuntimeEvent, shouldRecordBlockedAutomation } from "@/server/analytics/runtime-analytics";
import PublicProfile from "@/components/public/public-profile";
import TrafficShieldPreview from "@/components/public/traffic-shield-preview";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";
import { resolveSmartLink } from "@/server/smart-links/redirect-resolver";
import { getSmartLinkRequestContext } from "@/server/smart-links/request-context";
import { withSmartLinkOutboundRoutes } from "@/server/smart-links/outbound-routing";
import { getPublicSmartLinkBySlug } from "@/server/smart-links/smart-link-service";

type PublicProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const smartLink = await getPublicSmartLinkBySlug(slug);

  if (smartLink?.type === "DIRECT") {
    return {
      title: `${smartLink.title} | Linkzzz`,
      description: "Link destination powered by Linkzzz.",
    };
  }

  const profile = smartLink ? await getPublicProfileBySlug(slug) : null;

  if (!profile) {
    return {
      title: "Profile not found | Linkzzz",
      description: "This Linkzzz profile does not exist.",
    };
  }

  return {
    title: `${profile.displayName} | Linkzzz`,
    description: profile.bio,
    openGraph: {
      title: profile.displayName,
      description: profile.bio,
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { slug } = await params;
  const smartLink = await getPublicSmartLinkBySlug(slug);
  if (!smartLink) notFound();

  const requestHeaders = await headers();
  const context = getSmartLinkRequestContext(requestHeaders);
  const resolution = resolveSmartLink(smartLink, context);

  await recordSmartLinkRuntimeEvent({
    smartLink,
    headers: requestHeaders,
    context,
    type: "SMART_LINK_VIEW",
  });
  if (resolution.type === "BLOCK" && shouldRecordBlockedAutomation(context)) {
    await recordSmartLinkRuntimeEvent({
      smartLink,
      headers: requestHeaders,
      context,
      type: "BLOCKED_AUTOMATED_REQUEST",
    });
  }
  if (resolution.type === "DEEPLINK_HELPER") {
    await recordSmartLinkRuntimeEvent({
      smartLink,
      headers: requestHeaders,
      context,
      type: "DEEPLINK_ATTEMPT",
    });
  }

  if (resolution.type === "NOT_FOUND" || resolution.type === "BLOCK") notFound();
  if (resolution.type === "CRAWLER_PREVIEW") return <TrafficShieldPreview />;
  if (resolution.type === "REDIRECT") redirect(resolution.url);
  if (resolution.type === "DEEPLINK_HELPER") {
    return (
      <DeeplinkHelper
        slug={smartLink.slug}
        tracking={smartLink.tracking}
        mode={resolution.mode}
        providerName={resolution.providerName}
        appUrl={resolution.appUrl}
        fallbackUrl={resolution.fallbackUrl}
        browser={resolution.browser}
        platform={resolution.platform}
        longPressHelper={resolution.longPressHelper}
        autoAttempt={resolution.autoAttempt}
      />
    );
  }

  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const countryCode = getVisitorCountryCode(requestHeaders);
  const routedProfile = resolvePublicProfileGeoRouting(profile, countryCode);

  return (
    <PublicProfile
      initialProfile={withSmartLinkOutboundRoutes(routedProfile, smartLink.slug)}
      tracking={smartLink.tracking}
      initialNowMs={Date.now()}
    />
  );
}
