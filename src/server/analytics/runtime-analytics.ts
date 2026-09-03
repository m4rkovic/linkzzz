import "server-only";

import { after } from "next/server";

import { buildAnalyticsRequestMetadata } from "@/server/analytics/analytics-request-context";
import { getServerDependencies } from "@/server/persistence/dependencies";
import type { AnalyticsEventRecord } from "@/server/services/contracts";
import type { SmartLinkRequestContext } from "@/types/smart-link-runtime";
import type { SmartLinkRecord } from "@/types/smart-link";

type RequestHeaders = Pick<Headers, "get">;

type RuntimeEventType = Extract<
  AnalyticsEventRecord["type"],
  | "SMART_LINK_VIEW"
  | "LINK_CLICK"
  | "SOCIAL_CLICK"
  | "DEEPLINK_ATTEMPT"
  | "DEEPLINK_FALLBACK"
  | "BLOCKED_AUTOMATED_REQUEST"
>;

type RuntimeEventInput = {
  smartLink: Pick<SmartLinkRecord, "id" | "tracking">;
  headers: RequestHeaders;
  context: SmartLinkRequestContext;
  type: RuntimeEventType;
  pageCardId?: string | null;
};

export function scheduleSmartLinkRuntimeEvent(input: RuntimeEventInput) {
  if (!input.smartLink.tracking.internalAnalytics) return;
  after(() => recordSmartLinkRuntimeEvent(input));
}

export async function recordSmartLinkRuntimeEvent(input: RuntimeEventInput) {
  if (!input.smartLink.tracking.internalAnalytics) return;

  try {
    const dependencies = await getServerDependencies();
    if (!dependencies.analytics) return;

    await dependencies.analytics.create({
      smartLinkId: input.smartLink.id,
      pageCardId: input.pageCardId ?? null,
      type: input.type,
      ...buildAnalyticsRequestMetadata(input.headers, input.context),
    });
  } catch {
    // Analytics must never break a public redirect or profile render.
  }
}

export function shouldRecordBlockedAutomation(context: SmartLinkRequestContext) {
  return context.traffic !== "HUMAN";
}
