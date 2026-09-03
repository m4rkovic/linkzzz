import type { NextRequest } from "next/server";

import { isSameOriginRequest } from "@/server/security/origin";

type RequestHeaders = Pick<Headers, "get">;

export function getTrustedRequestIp(headers: RequestHeaders) {
  if (process.env.LINKZZZ_TRUST_PROXY_HEADERS !== "1") return "unknown";

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return headers.get("x-real-ip")?.trim() || "unknown";
}

export function getTrustedProxyHeader(headers: RequestHeaders, name: string) {
  if (process.env.LINKZZZ_TRUST_PROXY_HEADERS !== "1") return null;
  return headers.get(name)?.trim() || null;
}

export function getRequestIp(request: NextRequest) {
  return getTrustedRequestIp(request.headers);
}

export function getRequestRateLimitKey(request: NextRequest) {
  return getRequestIp(request);
}

export function hasValidRequestOrigin(request: NextRequest) {
  const trustProxyHeaders = process.env.LINKZZZ_TRUST_PROXY_HEADERS === "1";
  return isSameOriginRequest({
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    forwardedHost: trustProxyHeaders ? request.headers.get("x-forwarded-host") : null,
    forwardedProto: trustProxyHeaders ? request.headers.get("x-forwarded-proto") : null,
  });
}
