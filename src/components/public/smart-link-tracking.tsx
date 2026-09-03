"use client";

import Script from "next/script";

import {
  normalizeGa4MeasurementId,
  normalizeMetaPixelId,
} from "@/features/tracking/tracking-identifiers";
import type { TrackingConfig } from "@/types/smart-link";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export default function SmartLinkTracking({ tracking }: { tracking: TrackingConfig }) {
  const ga4MeasurementId = normalizeGa4MeasurementId(tracking.ga4MeasurementId);
  const metaPixelId = normalizeMetaPixelId(tracking.metaPixelId);

  return (
    <>
      {ga4MeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`}
            strategy="afterInteractive"
          />
          <Script id={`linkzzz-ga4-${ga4MeasurementId}`} strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(ga4MeasurementId)});`}
          </Script>
        </>
      ) : null}

      {metaPixelId ? (
        <Script id={`linkzzz-meta-${metaPixelId}`} strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(metaPixelId)});fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

export function trackSmartLinkExternalEvent(
  tracking: TrackingConfig,
  event: "destination_click" | "social_click" | "deeplink_attempt" | "deeplink_fallback",
  label?: string,
) {
  window.gtag?.("event", event, label ? { destination_label: label } : undefined);
  window.fbq?.("trackCustom", metaEventName(event), label ? { destination_label: label } : undefined);
}

function metaEventName(event: string) {
  return event.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
