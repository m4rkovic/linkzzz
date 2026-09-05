import { NextRequest, NextResponse } from "next/server";

import { getCustomerRequestSession } from "@/server/auth/request-session";
import { getSmartLinkLimit } from "@/server/business/plans";
import { getServerDependencies } from "@/server/persistence/dependencies";
import {
  checkRateLimit,
  SMART_LINK_CREATE_RATE_LIMIT,
} from "@/server/security/rate-limit";
import {
  createOwnSmartLink,
  listOwnSmartLinks,
} from "@/server/smart-links/smart-link-service";
import { hasValidRequestOrigin } from "@/server/security/request";
import type { CreateSmartLinkInput } from "@/server/smart-links/smart-link-service";

const MAX_BODY_BYTES = 16_384;

export async function GET(request: NextRequest) {
  const session = await getCustomerRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const dependencies = await getServerDependencies();
  const [smartLinks, subscription] = await Promise.all([
    listOwnSmartLinks(session),
    dependencies.subscriptions.findByUserId(session.user.id),
  ]);

  return NextResponse.json({
    smartLinks,
    plan: subscription?.plan ?? null,
    limit: subscription ? getSmartLinkLimit(subscription.plan) : 0,
  });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "SmartLink payload is too large." }, { status: 413 });
  }

  const session = await getCustomerRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(
    `${session.user.id}:smart-link-create`,
    SMART_LINK_CREATE_RATE_LIMIT,
  );
  if (!rateLimit.available) {
    return NextResponse.json(
      { error: "Request protection is temporarily unavailable." },
      { status: 503 },
    );
  }
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many SmartLink creation attempts. Try again shortly.",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!isCreateBody(body)) {
    return NextResponse.json({ error: "Invalid SmartLink payload." }, { status: 400 });
  }

  try {
    const result = await createOwnSmartLink(session, body);
    if (!result.ok) {
      const status =
        result.code === "SUBSCRIPTION_INACTIVE"
          ? 403
          : result.code === "SLUG_TAKEN" ||
              result.code === "SMART_LINK_LIMIT_REACHED"
            ? 409
            : 400;
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status },
      );
    }

    return NextResponse.json({ smartLink: result.smartLink }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "This SmartLink URL is already in use.", code: "SLUG_TAKEN" },
        { status: 409 },
      );
    }
    throw error;
  }
}

function isCreateBody(value: unknown): value is CreateSmartLinkInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  if (body.type !== "LANDING_PAGE" && body.type !== "DIRECT") return false;
  if (typeof body.title !== "string" || typeof body.slug !== "string") return false;
  if (body.primaryDestination === undefined) return true;
  if (
    !body.primaryDestination ||
    typeof body.primaryDestination !== "object" ||
    Array.isArray(body.primaryDestination)
  ) return false;
  const destination = body.primaryDestination as Record<string, unknown>;
  return (
    typeof destination.provider === "string" &&
    typeof destination.url === "string" &&
    (destination.label === undefined || typeof destination.label === "string") &&
    (destination.fallbackUrl === undefined ||
      typeof destination.fallbackUrl === "string")
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
