import { NextRequest, NextResponse } from "next/server";

import { logoutSession } from "@/server/auth/auth-service";
import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "@/server/security/session-cookie";
import { hasValidRequestOrigin } from "@/server/security/request";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const cookieName = getSessionCookieName();
  const token = request.cookies.get(cookieName)?.value;

  await logoutSession(token);

  const response = NextResponse.json({ ok: true });

  response.cookies.set(cookieName, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
