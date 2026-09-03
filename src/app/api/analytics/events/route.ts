import { NextRequest, NextResponse } from "next/server";

import { isSmartLinkHostAllowed } from "@/server/domains/custom-domain-service";
import { getVisitorCountryCode } from "@/server/geo/geo-routing";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp } from "@/server/security/request";
import { ANALYTICS_EVENT_RATE_LIMIT, checkRateLimit } from "@/server/security/rate-limit";
import { validateSlug } from "@/server/validation/slug";

const MAX_ANALYTICS_BODY_BYTES = 4_096;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_ANALYTICS_BODY_BYTES) {
    return NextResponse.json({ error: "Analytics payload is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });

  if (typeof body.slug !== "string") {
    return NextResponse.json({ error: "Invalid Smart Link." }, { status: 400 });
  }
  const slug = validateSlug(body.slug);
  if (!slug.ok) return NextResponse.json({ error: "Invalid Smart Link." }, { status: 400 });
  if (!(await isSmartLinkHostAllowed(request.headers, slug.value))) {
    return NextResponse.json({ error: "Smart Link not found." }, { status: 404 });
  }

  // Browser-originated analytics are intentionally limited to the one event
  // that cannot be authoritatively observed by the redirect response itself.
  // Views and clicks are recorded by the server runtime.
  if (body.type !== "DEEPLINK_FALLBACK") {
    return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  }

  const requestIp = getRequestIp(request);
  const rateLimit = await checkRateLimit(`${requestIp}:${slug.value}`, ANALYTICS_EVENT_RATE_LIMIT);
  if (!rateLimit.available) return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many analytics events.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });

  const dependencies = await getServerDependencies();
  if (!dependencies.analytics) return new NextResponse(null, { status: 204 });

  const userAgent = request.headers.get("user-agent") ?? "";
  const trustProxyHeaders = process.env.LINKZZZ_TRUST_PROXY_HEADERS === "1";
  const accepted = await dependencies.analytics.createForSlug(slug.value, {
    type: "DEEPLINK_FALLBACK",
    pageCardId: null,
    visitorId: typeof body.visitorId === "string" ? body.visitorId.slice(0, 100) : null,
    referrer: request.headers.get("referer")?.slice(0, 1000) ?? null,
    countryCode: getVisitorCountryCode(request.headers),
    countryName: null,
    city: trustProxyHeaders ? request.headers.get("x-vercel-ip-city")?.slice(0, 120) ?? null : null,
    device: /mobile/i.test(userAgent) ? "Mobile" : /tablet|ipad/i.test(userAgent) ? "Tablet" : "Desktop",
    browser: browserName(userAgent),
    os: osName(userAgent),
    isBot: /bot|crawler|spider|preview/i.test(userAgent) || requestIp === "unknown",
  });

  return new NextResponse(null, { status: accepted ? 202 : 404 });
}

function browserName(value: string) {
  if (/edg/i.test(value)) return "Edge";
  if (/chrome|crios/i.test(value)) return "Chrome";
  if (/safari/i.test(value)) return "Safari";
  if (/firefox|fxios/i.test(value)) return "Firefox";
  return "Other";
}

function osName(value: string) {
  if (/windows/i.test(value)) return "Windows";
  if (/android/i.test(value)) return "Android";
  if (/iphone|ipad|ios/i.test(value)) return "iOS";
  if (/mac os|macintosh/i.test(value)) return "macOS";
  if (/linux/i.test(value)) return "Linux";
  return "Other";
}
