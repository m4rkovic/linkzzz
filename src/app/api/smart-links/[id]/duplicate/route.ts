import { NextRequest, NextResponse } from "next/server";

import { getCustomerRequestSession } from "@/server/auth/request-session";
import { PageCardDuplicateLimitError } from "@/server/business/quota-errors";
import { checkRateLimit, SENSITIVE_ACTION_RATE_LIMIT } from "@/server/security/rate-limit";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { duplicateOwnSmartLink } from "@/server/smart-links/smart-link-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getCustomerRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(
    `${getRequestIp(request)}:${session.user.id}:smart-link-lifecycle`,
    SENSITIVE_ACTION_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json({ error: "Request protection is temporarily unavailable." }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many SmartLink lifecycle operations. Try again later.", retryAfterMs: rateLimit.retryAfterMs },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  try {
    const result = await duplicateOwnSmartLink(session, id);
    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : result.code === "SUBSCRIPTION_INACTIVE" || result.code === "SMART_LINK_DISABLED" ? 403 : 409;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }
    return NextResponse.json({ smartLink: result.smartLink }, { status: 201 });
  } catch (error) {
    if (error instanceof PageCardDuplicateLimitError) {
      const removeCount = error.currentCount - error.limit;
      return NextResponse.json(
        {
          error: `This Landing Page has ${error.currentCount} links, but the current plan allows up to ${error.limit}. Remove ${removeCount} ${removeCount === 1 ? "link" : "links"} before duplicating it.`,
          code: error.code,
          limit: error.limit,
          currentCount: error.currentCount,
        },
        { status: 409 },
      );
    }
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "Could not allocate a unique URL for the duplicate.", code: "SLUG_TAKEN" }, { status: 409 });
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown) {
  return !!error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "P2002";
}
