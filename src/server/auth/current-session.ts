import "server-only";

import { cookies } from "next/headers";

import { resolveSessionToken } from "@/server/auth/auth-service";
import { getSessionCookieName } from "@/server/security/session-cookie";

export async function getCurrentSession(
  options: { allowPasswordChangeRequired?: boolean } = {},
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  return resolveSessionToken(token, options);
}
