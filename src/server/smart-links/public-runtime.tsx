import "server-only";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import DeeplinkHelper from "@/components/public/deeplink-helper";
import PublicProfile from "@/components/public/public-profile";
import TrafficShieldPreview from "@/components/public/traffic-shield-preview";
import {
  scheduleSmartLinkRuntimeEvent,
  shouldRecordBlockedAutomation,
} from "@/server/analytics/runtime-analytics";
import { resolveActiveCustomDomain } from "@/server/domains/custom-domain-service";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";
import { withSmartLinkOutboundRoutes } from "@/server/smart-links/outbound-routing";
import { resolveSmartLink } from "@/server/smart-links/redirect-resolver";
import { getSmartLinkRequestContext } from "@/server/smart-links/request-context";
import { getPublicSmartLinkBySlug } from "@/server/smart-links/smart-link-service";
import { getServerRenderTimestamp } from "@/server/time/server-clock";

type RequestHeaders = Pick<Headers, "get">;

const getCachedPublicSmartLinkBySlug = cache(async (slug: string) =>
  getPublicSmartLinkBySlug(slug),
);

const getCachedPublicProfileBySlug = cache(async (slug: string) =>
  getPublicProfileBySlug(slug),
);

export const resolveCachedActiveCustomDomain = cache(async (host: string) =>
  resolveActiveCustomDomain(host),
);

export async function buildPublicSmartLinkMetadata(
  slug: string | null,
): Promise<Metadata> {
  const smartLink = slug ? await getCachedPublicSmartLinkBySlug(slug) : null;

  if (smartLink?.type === "DIRECT") {
    const description = "Link destination powered by Linkzzz.";
    return {
      title: { absolute: `${smartLink.title} | Linkzzz` },
      description,
      openGraph: {
        title: smartLink.title,
        description,
        type: "website",
      },
    };
  }

  const profile = smartLink && slug
    ? await getCachedPublicProfileBySlug(slug)
    : null;

  if (!profile) {
    return {
      title: { absolute: "Profile not found | Linkzzz" },
      description: "This Linkzzz profile does not exist.",
    };
  }

  return {
    title: { absolute: `${profile.displayName} | Linkzzz` },
    description: profile.bio,
    openGraph: {
      title: profile.displayName,
      description: profile.bio,
      type: "profile",
    },
  };
}

export async function renderSmartLinkRuntime(
  slug: string,
  requestHeaders: RequestHeaders,
) {
  const smartLink = await getCachedPublicSmartLinkBySlug(slug);
  if (!smartLink) notFound();

  const context = getSmartLinkRequestContext(requestHeaders);
  const resolution = resolveSmartLink(smartLink, context);

  scheduleSmartLinkRuntimeEvent({
    smartLink,
    headers: requestHeaders,
    context,
    type: "SMART_LINK_VIEW",
  });
  if (resolution.type === "BLOCK" && shouldRecordBlockedAutomation(context)) {
    scheduleSmartLinkRuntimeEvent({
      smartLink,
      headers: requestHeaders,
      context,
      type: "BLOCKED_AUTOMATED_REQUEST",
    });
  }
  if (resolution.type === "DEEPLINK_HELPER") {
    scheduleSmartLinkRuntimeEvent({
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

  const profile = await getCachedPublicProfileBySlug(slug);
  if (!profile) notFound();

  const countryCode = getVisitorCountryCode(requestHeaders);
  const routedProfile = resolvePublicProfileGeoRouting(profile, countryCode);

  return (
    <PublicProfile
      initialProfile={withSmartLinkOutboundRoutes(routedProfile, smartLink.slug)}
      tracking={smartLink.tracking}
      initialNowMs={getServerRenderTimestamp()}
    />
  );
}
