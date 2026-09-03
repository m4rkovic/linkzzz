import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { resolveSessionToken } from "@/server/auth/auth-service";
import { getSessionCookieName } from "@/server/security/session-cookie";

const resolveCurrentSession = cache(async (allowPasswordChangeRequired: boolean) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  return resolveSessionToken(token, { allowPasswordChangeRequired });
});

export function getCurrentSession(
  options: { allowPasswordChangeRequired?: boolean } = {},
) {
  return resolveCurrentSession(Boolean(options.allowPasswordChangeRequired));
}
