"use client";

import { useEffect, useState } from "react";

export function useScheduleClock(
  enabled: boolean,
  initialNowMs = 0,
  intervalMs = 1_000,
) {
  // Public pages receive a server timestamp so SSR and hydration agree.
  // Editor previews intentionally start at 0 and install the live clock after mount.
  const [nowMs, setNowMs] = useState(initialNowMs);

  useEffect(() => {
    if (!enabled) return;

    const update = () => setNowMs(Date.now());
    const kickoff = window.setTimeout(update, 0);
    const timer = window.setInterval(update, intervalMs);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);

  return nowMs;
}
