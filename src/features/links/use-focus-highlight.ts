"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveActiveCampaignLink } from "@/features/engagement/profile-engagement";
import { isLinkNavigable, resolveLinkAvailability } from "@/features/links/link-availability";
import type { PublicProfileData, PublicProfileLink } from "@/types/profile";

type FocusTarget = {
  key: string;
  link: PublicProfileLink;
  oncePerSession: boolean;
  delayMs: number;
  durationMs: number;
  storageKey: string;
};

export function useFocusHighlight(profile: PublicProfileData, isPreview: boolean, nowMs = 0) {
  const target = useMemo(
    () => resolveFocusTarget(profile, nowMs),
    [profile, nowMs],
  );
  const targetKey = target?.key ?? null;
  const targetOncePerSession = target?.oncePerSession ?? false;
  const targetDelayMs = target?.delayMs ?? 0;
  const targetDurationMs = target?.durationMs ?? 0;
  const targetStorageKey = target?.storageKey ?? "";
  const [activeKey, setActiveKey] = useState<string | null>(targetKey);

  useEffect(() => {
    let markTimer: number | null = null;
    let endTimer: number | null = null;

    const activationTimer = window.setTimeout(() => {
      if (!targetKey) {
        setActiveKey(null);
        return;
      }

      if (isPreview) {
        setActiveKey(targetKey);
        return;
      }

      if (targetOncePerSession) {
        try {
          if (window.sessionStorage.getItem(targetStorageKey) === "1") {
            setActiveKey(null);
            return;
          }
        } catch {
          // Storage can be disabled. The highlight still works for this visit.
        }
      }

      setActiveKey(targetKey);

      markTimer = targetOncePerSession
        ? window.setTimeout(() => {
            try {
              window.sessionStorage.setItem(targetStorageKey, "1");
            } catch {
              // Ignore blocked storage.
            }
          }, 0)
        : null;

      endTimer = window.setTimeout(
        () => setActiveKey((current) => current === targetKey ? null : current),
        targetDelayMs + targetDurationMs,
      );
    }, 0);

    return () => {
      window.clearTimeout(activationTimer);
      if (markTimer !== null) window.clearTimeout(markTimer);
      if (endTimer !== null) window.clearTimeout(endTimer);
    };
  }, [targetKey, targetDelayMs, targetDurationMs, targetOncePerSession, targetStorageKey, isPreview]);

  return target && activeKey === targetKey ? target.link : null;
}

export function isLinkDimmed(focusedLink: PublicProfileLink | null, link: PublicProfileLink) {
  return Boolean(
    focusedLink &&
    focusedLink.id !== link.id &&
    focusedLink.customStyle?.dimSiblings,
  );
}

function resolveFocusTarget(profile: PublicProfileData, nowMs: number): FocusTarget | null {
  const campaignLink = resolveActiveCampaignLink(profile, nowMs);
  const campaign = profile.engagement?.campaign;

  if (campaignLink && campaign?.enabled) {
    const focusEffect = campaign.focusEffect ?? "glow";
    if (focusEffect === "none") return null;

    const link: PublicProfileLink = {
      ...campaignLink,
      customStyle: {
        enabled: campaignLink.customStyle?.enabled ?? false,
        ...(campaignLink.customStyle ?? {}),
        focusEffect,
        dimSiblings: campaign.dimSiblings ?? true,
        focusColor: campaign.focusColor ?? campaignLink.customStyle?.focusColor ?? "#8e7dff",
        focusOncePerSession: false,
      },
    };
    const delayMs = Math.max(0, link.customStyle?.focusDelayMs ?? 0);
    const durationMs = Math.max(1500, link.customStyle?.focusDurationMs ?? 4500);
    return {
      key: focusKey("campaign", link, delayMs, durationMs),
      link,
      oncePerSession: false,
      delayMs,
      durationMs,
      storageKey: `linkzzz:campaign:${profile.slug}:${link.id}`,
    };
  }

  const link = profile.links.find(
    (candidate) =>
      candidate.visible &&
      isLinkNavigable(resolveLinkAvailability(candidate, nowMs)) &&
      candidate.customStyle?.focusEffect &&
      candidate.customStyle.focusEffect !== "none",
  );
  if (!link) return null;

  const delayMs = Math.max(0, link.customStyle?.focusDelayMs ?? 0);
  const durationMs = Math.max(1500, link.customStyle?.focusDurationMs ?? 4500);
  return {
    key: focusKey("link", link, delayMs, durationMs),
    link,
    oncePerSession: link.customStyle?.focusOncePerSession ?? false,
    delayMs,
    durationMs,
    storageKey: `linkzzz:focus:${profile.slug}:${link.id}`,
  };
}

function focusKey(source: "campaign" | "link", link: PublicProfileLink, delayMs: number, durationMs: number) {
  return [
    source,
    link.id,
    link.customStyle?.focusEffect ?? "none",
    link.customStyle?.dimSiblings ? "dim" : "full",
    link.customStyle?.focusColor ?? "",
    delayMs,
    durationMs,
  ].join(":");
}
