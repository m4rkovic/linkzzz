export const PRODUCTION_SESSION_COOKIE = "__Host-linkzzz_session";
export const DEVELOPMENT_SESSION_COOKIE = "linkzzz_session";

export type SessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
};

export function getSessionCookieName(isProduction = process.env.NODE_ENV === "production") {
  return isProduction
    ? PRODUCTION_SESSION_COOKIE
    : DEVELOPMENT_SESSION_COOKIE;
}

export function getSessionCookieOptions(
  isProduction = process.env.NODE_ENV === "production",
): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };
}
