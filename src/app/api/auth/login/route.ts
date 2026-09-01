import { NextRequest, NextResponse } from "next/server";

import { loginWithPassword } from "@/server/auth/auth-service";
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/server/security/session-cookie";
import {
  getRequestRateLimitKey,
  hasValidRequestOrigin,
} from "@/server/security/request";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isLoginBody(body)) {
    return NextResponse.json(
      { error: "Username/email and password are required." },
      { status: 400 },
    );
  }

  const result = await loginWithPassword({
    identifier: body.identifier,
    password: body.password,
    rememberMe: body.rememberMe,
    requestKey: getRequestRateLimitKey(request),
  });

  if (!result.ok) {
    if (result.code === "RATE_LIMITED") {
      return NextResponse.json(
        {
          error: "Too many sign-in attempts. Try again later.",
          retryAfterMs: result.retryAfterMs,
        },
        { status: 429 },
      );
    }

    if (result.code === "ACCOUNT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This account is currently unavailable." },
        { status: 403 },
      );
    }

    if (result.code === "SUBSCRIPTION_UNAVAILABLE") {
      return NextResponse.json(
        { error: "This subscription is not currently active." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Invalid username/email or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    role: result.session.user.role,
    mustChangePassword: result.session.mustChangePassword,
  });

  response.cookies.set(
    getSessionCookieName(),
    result.token,
    {
      ...getSessionCookieOptions(),
      expires: result.session.expiresAt,
    },
  );

  return response;
}

function isLoginBody(value: unknown): value is {
  identifier: string;
  password: string;
  rememberMe: boolean;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.identifier === "string" &&
    body.identifier.trim().length > 0 &&
    body.identifier.length <= 320 &&
    typeof body.password === "string" &&
    body.password.length > 0 &&
    body.password.length <= 512 &&
    typeof body.rememberMe === "boolean"
  );
}
