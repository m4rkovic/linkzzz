"use client";

import { useEffect } from "react";

import { trackSmartLinkExternalEvent } from "@/components/public/smart-link-tracking";
import type { TrackingConfig } from "@/types/smart-link";

export default function PublicSocialTracking({
  tracking,
}: {
  tracking: TrackingConfig;
}) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLElement>("[data-linkzzz-social-id]");
      const socialId = link?.dataset.linkzzzSocialId;
      if (!socialId) return;
      trackSmartLinkExternalEvent(tracking, "social_click", socialId);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [tracking]);

  return null;
}
