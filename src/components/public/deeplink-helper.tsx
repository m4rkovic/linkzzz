"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Smartphone } from "lucide-react";

import SmartLinkTracking, { trackSmartLinkExternalEvent } from "@/components/public/smart-link-tracking";

import type { VisitorBrowser, VisitorPlatform } from "@/types/smart-link-runtime";
import type { TrackingConfig } from "@/types/smart-link";

const APP_FALLBACK_DELAY_MS = 1_500;

type DeeplinkHelperProps = {
  slug: string;
  tracking: TrackingConfig;
  mode: "APP_OPEN" | "EXTERNAL_BROWSER";
  providerName: string;
  appUrl: string | null;
  fallbackUrl: string;
  browser: VisitorBrowser;
  platform: VisitorPlatform;
  longPressHelper: boolean;
  autoAttempt: boolean;
};

export default function DeeplinkHelper({
  slug,
  tracking,
  mode,
  providerName,
  appUrl,
  fallbackUrl,
  browser,
  platform,
  longPressHelper,
  autoAttempt,
}: DeeplinkHelperProps) {
  const [attempted, setAttempted] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelFallback = useCallback(() => {
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
  }, []);

  const recordFallback = useCallback(() => {
    trackSmartLinkExternalEvent(tracking, "deeplink_fallback", providerName);
    if (!tracking.internalAnalytics) return;
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, type: "DEEPLINK_FALLBACK" }),
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined);
  }, [providerName, slug, tracking]);

  const openApp = useCallback(() => {
    if (!appUrl) {
      recordFallback();
      window.location.assign(fallbackUrl);
      return;
    }

    setAttempted(true);
    cancelFallback();
    fallbackTimer.current = setTimeout(() => {
      if (document.visibilityState === "visible") {
        recordFallback();
        window.location.replace(fallbackUrl);
      }
    }, APP_FALLBACK_DELAY_MS);
    window.location.href = appUrl;
  }, [appUrl, cancelFallback, fallbackUrl, recordFallback]);

  useEffect(() => {
    trackSmartLinkExternalEvent(tracking, "deeplink_attempt", providerName);
  }, [providerName, tracking]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") cancelFallback();
    };
    const onPageHide = () => cancelFallback();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    if (autoAttempt && appUrl) {
      // Defer one tick so the helper UI is available if the browser rejects the
      // custom scheme immediately.
      const timer = setTimeout(openApp, 60);
      return () => {
        clearTimeout(timer);
        cancelFallback();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        window.removeEventListener("pagehide", onPageHide);
      };
    }

    return () => {
      cancelFallback();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [appUrl, autoAttempt, cancelFallback, openApp]);

  const browserName = browserLabel(browser);
  const externalHelper = mode === "EXTERNAL_BROWSER";

  return (
    <>
      <SmartLinkTracking tracking={tracking} />
      <main className="min-h-screen bg-[#09090b] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            {externalHelper ? <ExternalLink size={22} /> : <Smartphone size={22} />}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
            Linkzzz SmartLink
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {externalHelper
              ? `Open ${providerName} outside ${browserName}`
              : `Opening ${providerName}`}
          </h1>

          <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base">
            {externalHelper
              ? externalBrowserCopy(browser, platform)
              : attempted
                ? `We tried to open the ${providerName} app. If it did not open, continue using the normal destination below.`
                : `We will try the ${providerName} app first and fall back to the normal destination if needed.`}
          </p>

          <div className="mt-7 grid gap-3">
            {appUrl ? (
              <button
                type="button"
                onClick={openApp}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Try {providerName} app
              </button>
            ) : null}

            <a
              href={fallbackUrl}
              onClick={recordFallback}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              Continue to {providerName}
            </a>
          </div>

          {longPressHelper ? (
            <p className="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-xs leading-5 text-white/45">
              If your in-app browser keeps intercepting the link, long-press the destination button and choose the option to open it in your browser when available.
            </p>
          ) : null}

          <p className="mt-6 text-xs leading-5 text-white/30">
            App opening depends on your device, installed apps and the browser you came from. The normal destination always remains available.
          </p>
        </section>
        </div>
      </main>
    </>
  );
}

function browserLabel(browser: VisitorBrowser) {
  switch (browser) {
    case "INSTAGRAM": return "Instagram";
    case "FACEBOOK": return "Facebook";
    case "MESSENGER": return "Messenger";
    case "TIKTOK": return "TikTok";
    case "X": return "X";
    case "TELEGRAM": return "Telegram";
    case "REDDIT": return "Reddit";
    case "LINKEDIN": return "LinkedIn";
    case "DISCORD": return "Discord";
    case "SAFARI": return "Safari";
    case "CHROME": return "Chrome";
    case "EDGE": return "Edge";
    case "FIREFOX": return "Firefox";
    default: return "this browser";
  }
}

function externalBrowserCopy(browser: VisitorBrowser, platform: VisitorPlatform) {
  if (["INSTAGRAM", "FACEBOOK", "MESSENGER", "TIKTOK", "X", "REDDIT", "LINKEDIN"].includes(browser)) {
    return `This link is currently inside ${browserLabel(browser)}'s built-in browser. Use its menu or share controls and choose the option to open the page in your normal ${platform === "IOS" ? "Safari" : "browser"}.`;
  }
  return "Your current browser may restrict app links. Open this page in your normal browser, or continue directly to the web destination below.";
}
