import { NextRequest, NextResponse } from "next/server";
import { getVisitorCountryCode } from "@/server/geo/geo-routing";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp } from "@/server/security/request";
import { ANALYTICS_EVENT_RATE_LIMIT, checkRateLimit } from "@/server/security/rate-limit";

const EVENT_TYPES = new Set(["PAGE_VIEW", "LINK_CLICK", "SOCIAL_CLICK", "DEEPLINK_FALLBACK"]);
const MAX_ANALYTICS_BODY_BYTES = 4_096;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_ANALYTICS_BODY_BYTES) return NextResponse.json({ error: "Analytics payload is too large." }, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
  const input = body as Record<string, unknown>;
  if (typeof input.slug !== "string" || !/^[a-z0-9-]{3,40}$/.test(input.slug)) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  const rateLimit = await checkRateLimit(`${getRequestIp(request)}:${input.slug}`, ANALYTICS_EVENT_RATE_LIMIT);
  if (!rateLimit.available) return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many analytics events.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });
  if (typeof input.type !== "string" || !EVENT_TYPES.has(input.type)) return NextResponse.json({ error: "Invalid event type." }, { status: 400 });
  if (input.linkId !== undefined && (typeof input.linkId !== "string" || input.linkId.length > 100)) return NextResponse.json({ error: "Invalid link." }, { status: 400 });

  const dependencies = await getServerDependencies();
  if (!dependencies.analytics) return new NextResponse(null, { status: 204 });
  const userAgent = request.headers.get("user-agent") ?? "";
  const accepted = await dependencies.analytics.createForSlug(input.slug, {
    type: input.type as "PAGE_VIEW" | "LINK_CLICK" | "SOCIAL_CLICK" | "DEEPLINK_FALLBACK",
    pageCardId: input.type === "LINK_CLICK" ? (input.linkId as string | undefined) : null,
    visitorId: typeof input.visitorId === "string" ? input.visitorId.slice(0, 100) : null,
    referrer: request.headers.get("referer")?.slice(0, 1000) ?? null,
    countryCode: getVisitorCountryCode(request.headers),
    countryName: null,
    city: request.headers.get("x-vercel-ip-city")?.slice(0, 120) ?? null,
    device: /mobile/i.test(userAgent) ? "Mobile" : /tablet|ipad/i.test(userAgent) ? "Tablet" : "Desktop",
    browser: browserName(userAgent),
    os: osName(userAgent),
    isBot: /bot|crawler|spider|preview/i.test(userAgent) || getRequestIp(request) === "unknown",
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
