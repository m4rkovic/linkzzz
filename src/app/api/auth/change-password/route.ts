import { NextRequest, NextResponse } from "next/server";

import {
  changePassword,
  resolveSessionToken,
} from "@/server/auth/auth-service";
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

  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;
  const session = await resolveSessionToken(token, {
    allowPasswordChangeRequired: true,
  });

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isChangePasswordBody(body)) {
    return NextResponse.json(
      { error: "Current and new passwords are required." },
      { status: 400 },
    );
  }

  const result = await changePassword({
    session,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    requestKey: getRequestRateLimitKey(request),
  });

  if (!result.ok) {
    if (result.code === "RATE_LIMITED") {
      return NextResponse.json(
        {
          error: "Too many password change attempts. Try again later.",
          retryAfterMs: result.retryAfterMs,
        },
        { status: 429 },
      );
    }

    if (result.code === "INVALID_CURRENT_PASSWORD") {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 400 },
      );
    }

    if (result.code === "PASSWORD_UNCHANGED") {
      return NextResponse.json(
        { error: "Your new password must be different from the current password." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: result.message ?? "New password does not meet requirements." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set(cookieName, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}

function isChangePasswordBody(value: unknown): value is {
  currentPassword: string;
  newPassword: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as Record<string, unknown>;

  return (
    typeof body.currentPassword === "string" &&
    body.currentPassword.length > 0 &&
    body.currentPassword.length <= 512 &&
    typeof body.newPassword === "string" &&
    body.newPassword.length > 0 &&
    body.newPassword.length <= 512
  );
}
