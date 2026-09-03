import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import DeeplinkHelper from "@/components/public/deeplink-helper";
import { scheduleSmartLinkRuntimeEvent, shouldRecordBlockedAutomation } from "@/server/analytics/runtime-analytics";
import TrafficShieldPreview from "@/components/public/traffic-shield-preview";
import SensitiveContentWarning from "@/components/public/sensitive-content-warning";
import { destinationProviderFromPlatformId, getDestinationProvider } from "@/features/destinations/provider-registry";
import { isLinkNavigable, resolveLinkAvailability } from "@/features/links/link-availability";
import { resolveLinkGeo } from "@/features/links/link-geo";
import { resolveSensitiveContentWarning } from "@/features/links/sensitive-content";
import { resolveScheduleWindow } from "@/features/scheduling/schedule";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";
import { getRequestHostname, isApplicationHostname } from "@/server/domains/host-routing";
import { resolveOutboundDestination } from "@/server/smart-links/redirect-resolver";
import { getSmartLinkRequestContext } from "@/server/smart-links/request-context";
import { isPublicDestinationKind } from "@/server/smart-links/outbound-routing";
import { getPublicSmartLinkBySlug } from "@/server/smart-links/smart-link-service";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type { DestinationConfig } from "@/types/smart-link";

export const metadata: Metadata = {
  title: "Opening destination | Linkzzz",
  robots: { index: false, follow: false },
};

type OutboundPageProps = {
  params: Promise<{
    slug: string;
    kind: string;
    id: string;
  }>;
  searchParams: Promise<{ confirmSensitive?: string }>;
};

export default async function SmartLinkOutboundPage({ params, searchParams }: OutboundPageProps) {
  const [{ slug, kind, id }, query] = await Promise.all([params, searchParams]);
  if (!isPublicDestinationKind(kind)) notFound();

  const [smartLink, profile] = await Promise.all([
    getPublicSmartLinkBySlug(slug),
    getPublicProfileBySlug(slug),
  ]);
  if (!smartLink || smartLink.type !== "LANDING_PAGE" || !profile) notFound();

  const requestHeaders = await headers();
  const countryCode = getVisitorCountryCode(requestHeaders);
  const routedProfile = resolvePublicProfileGeoRouting(profile, countryCode);

  if (kind === "card" && query.confirmSensitive !== "1") {
    const card = routedProfile.links.find((candidate) => candidate.id === id);
    const warning = card && isLinkNavigable(resolveLinkAvailability(card))
      ? resolveSensitiveContentWarning(card)
      : null;
    if (warning) {
      const host = getRequestHostname(requestHeaders);
      const backHref = host && !isApplicationHostname(host) ? "/" : `/${encodeURIComponent(slug)}`;
      return (
        <SensitiveContentWarning
          title={warning.title}
          message={warning.message}
          continueLabel={warning.continueLabel}
          continueHref={`/${encodeURIComponent(slug)}/out/card/${encodeURIComponent(id)}?confirmSensitive=1`}
          backHref={backHref}
        />
      );
    }
  }

  const destination = destinationFromProfile(profile, kind, id, countryCode);
  if (!destination) notFound();

  const context = getSmartLinkRequestContext(requestHeaders);
  const resolution = resolveOutboundDestination(smartLink, destination, context);

  scheduleSmartLinkRuntimeEvent({
    smartLink,
    headers: requestHeaders,
    context,
    type: kind === "social" ? "SOCIAL_CLICK" : "LINK_CLICK",
    pageCardId: kind === "card" ? id : null,
  });
  if (resolution.type === "BLOCK" && shouldRecordBlockedAutomation(context)) {
    scheduleSmartLinkRuntimeEvent({ smartLink, headers: requestHeaders, context, type: "BLOCKED_AUTOMATED_REQUEST" });
  }
  if (resolution.type === "DEEPLINK_HELPER") {
    scheduleSmartLinkRuntimeEvent({ smartLink, headers: requestHeaders, context, type: "DEEPLINK_ATTEMPT" });
  }

  if (resolution.type === "NOT_FOUND" || resolution.type === "RENDER_PAGE" || resolution.type === "BLOCK") notFound();
  if (resolution.type === "CRAWLER_PREVIEW") return <TrafficShieldPreview />;
  if (resolution.type === "REDIRECT") redirect(resolution.url);

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

function destinationFromProfile(
  profile: PersistedProfileData,
  kind: "card" | "social" | "block",
  id: string,
  countryCode?: string | null,
): DestinationConfig | null {
  if (kind === "card") {
    const card = profile.links.find((candidate) => candidate.id === id);
    if (!card || !isLinkNavigable(resolveLinkAvailability(card))) return null;

    const geoResolution = resolveLinkGeo(card, countryCode);
    if (!geoResolution.visible) return null;
    if (geoResolution.destination) {
      return {
        ...geoResolution.destination,
        label: geoResolution.destination.label || card.title || getDestinationProvider(geoResolution.destination.provider).name,
      };
    }

    const provider = destinationProviderFromPlatformId(card.platform);
    return {
      provider,
      label: card.title || getDestinationProvider(provider).name,
      url: geoResolution.url,
    };
  }

  if (kind === "block") {
    const block = profile.contentBlocks.find(
      (candidate) =>
        candidate.id === id &&
        candidate.visible &&
        candidate.type === "CTA" &&
        resolveScheduleWindow(candidate) === "ACTIVE",
    );
    if (!block || block.type !== "CTA") return null;
    return { provider: "CUSTOM", label: block.title || "CTA", url: block.url };
  }

  const social = profile.socials.find((candidate) => candidate.id === id && candidate.visible);
  if (!social) return null;
  const provider = destinationProviderFromPlatformId(social.platform);
  return {
    provider,
    label: social.name || getDestinationProvider(provider).name,
    url: social.url,
  };
}
