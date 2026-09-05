import { NextRequest, NextResponse } from "next/server";

import { getCustomerRequestSession } from "@/server/auth/request-session";
import {
  customDomainErrorStatus,
  isCustomDomainError,
} from "@/server/domains/custom-domain-errors";
import {
  addCustomDomain,
  customDomainView,
  listCustomDomains,
  removeCustomDomain,
  setCustomDomainActive,
  verifyCustomDomain,
} from "@/server/domains/custom-domain-service";
import {
  getRequestCorrelationId,
  logServerError,
} from "@/server/observability/server-logger";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import {
  checkRateLimit,
  CUSTOM_DOMAIN_RATE_LIMIT,
} from "@/server/security/rate-limit";

export async function GET(request: NextRequest) {
  const session = await getCustomerRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required.", code: "AUTHENTICATION_REQUIRED" },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit(
    `${getRequestIp(request)}:${session.user.id}`,
    CUSTOM_DOMAIN_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json(
      {
        error: "Request protection is temporarily unavailable.",
        code: "REQUEST_PROTECTION_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many domain operations. Try again later.",
        code: "RATE_LIMITED",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 },
    );
  }

  const smartLinkId = request.nextUrl.searchParams.get("smartLinkId")?.trim();
  if (!smartLinkId) {
    return NextResponse.json(
      { error: "smartLinkId is required.", code: "SMART_LINK_ID_REQUIRED" },
      { status: 400 },
    );
  }

  try {
    const domains = await listCustomDomains(session.user.id, smartLinkId);
    return NextResponse.json({
      domains: domains.map((domain) => customDomainView(domain)),
    });
  } catch (error) {
    return customDomainFailure(error, {
      requestId: getRequestCorrelationId(request.headers),
      operation: "list",
      userId: session.user.id,
      smartLinkId,
    });
  }
}

export async function POST(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;

  try {
    const domain = await addCustomDomain(
      prepared.userId,
      prepared.smartLinkId,
      prepared.domain,
    );
    return NextResponse.json(
      { domain: customDomainView(domain) },
      { status: 201 },
    );
  } catch (error) {
    return customDomainFailure(error, { ...prepared, operation: "add" });
  }
}

export async function PATCH(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;

  if (
    prepared.action !== "VERIFY" &&
    prepared.action !== "ACTIVATE" &&
    prepared.action !== "DISABLE"
  ) {
    return NextResponse.json(
      { error: "Invalid domain action.", code: "INVALID_DOMAIN_ACTION" },
      { status: 400 },
    );
  }

  try {
    const domain = prepared.action === "VERIFY"
      ? await verifyCustomDomain(
          prepared.userId,
          prepared.smartLinkId,
          prepared.domain,
        )
      : await setCustomDomainActive(
          prepared.userId,
          prepared.smartLinkId,
          prepared.domain,
          prepared.action === "ACTIVATE",
        );

    return NextResponse.json({
      domain: customDomainView(domain),
    });
  } catch (error) {
    return customDomainFailure(error, {
      ...prepared,
      operation: prepared.action.toLowerCase(),
    });
  }
}

export async function DELETE(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;

  try {
    await removeCustomDomain(
      prepared.userId,
      prepared.smartLinkId,
      prepared.domain,
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return customDomainFailure(error, { ...prepared, operation: "remove" });
  }
}

async function prepareWrite(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin.", code: "INVALID_REQUEST_ORIGIN" },
      { status: 403 },
    );
  }

  const session = await getCustomerRequestSession(request);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required.", code: "AUTHENTICATION_REQUIRED" },
      { status: 401 },
    );
  }

  const rateLimit = await checkRateLimit(
    `${getRequestIp(request)}:${session.user.id}`,
    CUSTOM_DOMAIN_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json(
      {
        error: "Request protection is temporarily unavailable.",
        code: "REQUEST_PROTECTION_UNAVAILABLE",
      },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many domain operations. Try again later.",
        code: "RATE_LIMITED",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null) as {
    smartLinkId?: unknown;
    domain?: unknown;
    action?: unknown;
  } | null;
  if (typeof body?.smartLinkId !== "string" || !body.smartLinkId.trim()) {
    return NextResponse.json(
      { error: "smartLinkId is required.", code: "SMART_LINK_ID_REQUIRED" },
      { status: 400 },
    );
  }
  if (typeof body?.domain !== "string") {
    return NextResponse.json(
      { error: "Domain is required.", code: "DOMAIN_REQUIRED" },
      { status: 400 },
    );
  }

  return {
    requestId: getRequestCorrelationId(request.headers),
    userId: session.user.id,
    smartLinkId: body.smartLinkId.trim(),
    domain: body.domain,
    action: body.action,
  };
}

function customDomainFailure(
  error: unknown,
  context: Record<string, unknown>,
) {
  if (isCustomDomainError(error)) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: customDomainErrorStatus(error.code) },
    );
  }

  logServerError("custom_domain.operation_failed", error, context);
  return NextResponse.json(
    {
      error: "Custom domain operation failed.",
      code: "CUSTOM_DOMAIN_OPERATION_FAILED",
    },
    { status: 500 },
  );
}
