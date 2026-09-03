import { NextRequest, NextResponse } from "next/server";

import { isSmartLinkHostAllowed } from "@/server/domains/custom-domain-service";
import { captureEmailLead } from "@/server/profile/lead-capture-service";
import { checkRateLimit, LEAD_CAPTURE_RATE_LIMIT } from "@/server/security/rate-limit";
import { getRequestIp } from "@/server/security/request";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  if (!(await isSmartLinkHostAllowed(request.headers, slug))) {
    return NextResponse.json({ error: "Smart Link not found." }, { status: 404 });
  }

  const rateLimit = await checkRateLimit(
    `${getRequestIp(request)}:${slug.trim().toLowerCase()}`,
    LEAD_CAPTURE_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json({ error: "Lead protection is temporarily unavailable." }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Try again later.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null) as {
    blockId?: unknown;
    email?: unknown;
  } | null;
  if (
    typeof body?.blockId !== "string" ||
    body.blockId.length < 1 ||
    body.blockId.length > 100 ||
    typeof body.email !== "string"
  ) {
    return NextResponse.json({ error: "Invalid lead submission." }, { status: 400 });
  }

  const result = await captureEmailLead(slug, body.blockId, body.email);
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : result.code === "UNAVAILABLE" ? 503 : 400;
    return NextResponse.json({ error: result.message }, { status });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
