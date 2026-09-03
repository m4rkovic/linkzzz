import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import DeeplinkHelper from "@/components/public/deeplink-helper";
import LandingPage from "@/components/landing/landing-page";
import { scheduleSmartLinkRuntimeEvent, shouldRecordBlockedAutomation } from "@/server/analytics/runtime-analytics";
import PublicProfile from "@/components/public/public-profile";
import TrafficShieldPreview from "@/components/public/traffic-shield-preview";
import { resolveActiveCustomDomain } from "@/server/domains/custom-domain-service";
import { getRequestHostname, isApplicationHostname } from "@/server/domains/host-routing";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";
import { resolveSmartLink } from "@/server/smart-links/redirect-resolver";
import { getSmartLinkRequestContext } from "@/server/smart-links/request-context";
import { withSmartLinkOutboundRoutes } from "@/server/smart-links/outbound-routing";
import { getPublicSmartLinkBySlug } from "@/server/smart-links/smart-link-service";
import { getServerRenderTimestamp } from "@/server/time/server-clock";

export default async function Home() {
  const requestHeaders = await headers();
  const host = getRequestHostname(requestHeaders);
  if (host && !isApplicationHostname(host)) {
    const slug = await resolveActiveCustomDomain(host);
    if (!slug) notFound();
    const smartLink = await getPublicSmartLinkBySlug(slug);
    if (!smartLink) notFound();
    const context = getSmartLinkRequestContext(requestHeaders);
    const resolution = resolveSmartLink(smartLink, context);
    scheduleSmartLinkRuntimeEvent({ smartLink, headers: requestHeaders, context, type: "SMART_LINK_VIEW" });
    if (resolution.type === "BLOCK" && shouldRecordBlockedAutomation(context)) {
      scheduleSmartLinkRuntimeEvent({ smartLink, headers: requestHeaders, context, type: "BLOCKED_AUTOMATED_REQUEST" });
    }
    if (resolution.type === "DEEPLINK_HELPER") {
      scheduleSmartLinkRuntimeEvent({ smartLink, headers: requestHeaders, context, type: "DEEPLINK_ATTEMPT" });
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

  return <LandingPage />;
}
