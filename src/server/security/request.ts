import type { NextRequest } from "next/server";

import { isSameOriginRequest } from "@/server/security/origin";

export function getRequestIp(request: NextRequest) {
  if (process.env.LINKZZZ_TRUST_PROXY_HEADERS !== "1") return "unknown";

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip")?.trim() || "unknown";
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
