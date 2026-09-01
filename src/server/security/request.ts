import type { NextRequest } from "next/server";

import { isSameOriginRequest } from "@/server/security/origin";

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function getRequestRateLimitKey(request: NextRequest) {
  return getRequestIp(request);
}

export function hasValidRequestOrigin(request: NextRequest) {
  return isSameOriginRequest({
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
  });
}
