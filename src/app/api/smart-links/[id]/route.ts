import { NextRequest, NextResponse } from "next/server";

import { resolveSessionToken } from "@/server/auth/auth-service";
import {
  deleteOwnSmartLink,
  getOwnSmartLink,
  updateOwnSmartLink,
} from "@/server/smart-links/smart-link-service";
import { getSessionCookieName } from "@/server/security/session-cookie";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { checkRateLimit, SENSITIVE_ACTION_RATE_LIMIT } from "@/server/security/rate-limit";

const MAX_SMART_LINK_BODY_BYTES = 128_000;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const { id } = await context.params;
  const smartLink = await getOwnSmartLink(session, id);
  if (!smartLink) {
    return NextResponse.json({ error: "SmartLink not found." }, { status: 404 });
  }
  return NextResponse.json({ smartLink });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_SMART_LINK_BODY_BYTES) {
    return NextResponse.json({ error: "SmartLink payload is too large." }, { status: 413 });
  }

  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    smartLink?: unknown;
    revision?: unknown;
  } | null;
  if (!body || !("smartLink" in body) || !isRevision(body.revision)) {
    return NextResponse.json(
      { error: "SmartLink and revision are required." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const result = await updateOwnSmartLink(
      session,
      id,
      body.smartLink,
      body.revision,
    );
    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "SMART_LINK_DISABLED"
            ? 403
            : result.code === "SMART_LINK_CONFLICT" || result.code === "SLUG_TAKEN"
              ? 409
              : 400;
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status },
      );
    }

    return NextResponse.json({ ok: true, smartLink: result.smartLink });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return NextResponse.json(
        {
          error: "This Smart Link URL is already in use.",
          code: "SLUG_TAKEN",
        },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
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

  const body = await request.json().catch(() => null) as { revision?: unknown } | null;
  if (!isRevision(body?.revision)) {
    return NextResponse.json({ error: "SmartLink revision is required." }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await deleteOwnSmartLink(session, id, body.revision);
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : result.code === "SMART_LINK_CONFLICT" ? 409 : 403;
    return NextResponse.json({ error: result.message, code: result.code }, { status });
  }

  return new NextResponse(null, { status: 204 });
}

function isRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 1;
}

function isPrismaUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002",
  );
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return resolveSessionToken(token);
}
