import { NextRequest, NextResponse } from "next/server";

import { buildAnalyticsRequestMetadata } from "@/server/analytics/analytics-request-context";
import { isSmartLinkHostAllowed } from "@/server/domains/custom-domain-service";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp } from "@/server/security/request";
import { readJsonBodyWithLimit } from "@/server/security/request-body";
import { ANALYTICS_EVENT_RATE_LIMIT, checkRateLimit } from "@/server/security/rate-limit";
import { getSmartLinkRequestContext } from "@/server/smart-links/request-context";
import { validateSlug } from "@/server/validation/slug";

const MAX_ANALYTICS_BODY_BYTES = 4_096;
const ANALYTICS_BODY_KEYS = new Set(["slug", "type"]);

type BrowserAnalyticsBody = {
  slug: string;
  type: "DEEPLINK_FALLBACK";
};

export async function POST(request: NextRequest) {
  const requestIp = getRequestIp(request);
  const rateLimit = await checkRateLimit(
    `analytics-ingest:${requestIp}`,
    ANALYTICS_EVENT_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable." },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many analytics events.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 },
    );
  }

  const bodyResult = await readJsonBodyWithLimit(request, MAX_ANALYTICS_BODY_BYTES);
  if (!bodyResult.ok) {
    return NextResponse.json(
      {
        error:
          bodyResult.reason === "TOO_LARGE"
            ? "Analytics payload is too large."
            : "Invalid analytics payload.",
      },
      { status: bodyResult.reason === "TOO_LARGE" ? 413 : 400 },
    );
  }

  const body = parseBrowserAnalyticsBody(bodyResult.value);
  if (!body) {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }

  const slug = validateSlug(body.slug);
  if (!slug.ok) {
    return NextResponse.json({ error: "Invalid Smart Link." }, { status: 400 });
  }
  if (!(await isSmartLinkHostAllowed(request.headers, slug.value))) {
    return NextResponse.json({ error: "Smart Link not found." }, { status: 404 });
  }

  const dependencies = await getServerDependencies();
  if (!dependencies.analytics) return new NextResponse(null, { status: 204 });

  const context = getSmartLinkRequestContext(request.headers);
  const accepted = await dependencies.analytics.createForSlug(slug.value, {
    type: "DEEPLINK_FALLBACK",
    pageCardId: null,
    ...buildAnalyticsRequestMetadata(request.headers, context),
  });

  return new NextResponse(null, { status: accepted ? 202 : 404 });
}

function parseBrowserAnalyticsBody(value: unknown): BrowserAnalyticsBody | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !ANALYTICS_BODY_KEYS.has(key))) return null;
  if (typeof body.slug !== "string" || body.type !== "DEEPLINK_FALLBACK") return null;

  return { slug: body.slug, type: body.type };
}
