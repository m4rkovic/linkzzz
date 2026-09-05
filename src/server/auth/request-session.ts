import type { NextRequest } from "next/server";

import { resolveSessionToken } from "@/server/auth/auth-service";
import { getSessionCookieName } from "@/server/security/session-cookie";

export async function getRequestSession(
  request: Pick<NextRequest, "cookies">,
) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return resolveSessionToken(token);
}

export async function getCustomerRequestSession(
  request: Pick<NextRequest, "cookies">,
) {
  const session = await getRequestSession(request);
  return session?.user.role === "CUSTOMER" ? session : null;
}
