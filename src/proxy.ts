import { randomBytes } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getRequestHostname,
  isAllowedCustomDomainPath,
  isApplicationHostname,
} from "@/server/domains/host-routing";
import { buildContentSecurityPolicy } from "@/server/security/content-security-policy";

export function proxy(request: NextRequest) {
  const hostname = getRequestHostname(request.headers);
  if (
    hostname &&
    !isApplicationHostname(hostname) &&
    !isAllowedCustomDomainPath(request.nextUrl.pathname)
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const nonce = randomBytes(16).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);

  if (process.env.NODE_ENV === "production" && isConfiguredApplicationHost(request.nextUrl.hostname)) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  return response;
}

function isConfiguredApplicationHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  const configured = (process.env.LINKZZZ_APP_HOSTS ?? "linkzzz.com,www.linkzzz.com")
    .split(",")
    .map((value) => value.trim().toLowerCase().replace(/\.$/, ""))
    .filter(Boolean);
  return configured.includes(normalized);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    },
  ],
};
