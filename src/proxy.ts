import { randomBytes } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  getRequestHostname,
  isAllowedCustomDomainPath,
  isApplicationHostname,
} from "@/server/domains/host-routing";
import {
  buildContentSecurityPolicy,
  buildStaticMarketingContentSecurityPolicy,
} from "@/server/security/content-security-policy";

const INTERNAL_CUSTOM_DOMAIN_PATH = "/__linkzzz/custom-domain";

export function proxy(request: NextRequest) {
  const hostname = getRequestHostname(request.headers);
  const isApplicationHost = hostname ? isApplicationHostname(hostname) : false;
  const pathname = request.nextUrl.pathname;

  if (
    hostname &&
    !isApplicationHost &&
    !isAllowedCustomDomainPath(pathname)
  ) {
    return notFoundResponse();
  }

  // Internal runtime routes are implementation details and must never become a
  // second public surface on a Linkzzz application host.
  if (isApplicationHost && pathname.startsWith("/__linkzzz/")) {
    return notFoundResponse();
  }

  // Keep the trusted marketing homepage prerenderable. It contains no customer
  // content and all links into authenticated surfaces perform full navigations,
  // so the static bootstrap policy cannot bleed into the application.
  if (isApplicationHost && pathname === "/") {
    const response = NextResponse.next();
    response.headers.set(
      "Content-Security-Policy",
      buildStaticMarketingContentSecurityPolicy({
        isDevelopment: process.env.NODE_ENV === "development",
      }),
    );
    applyTransportSecurity(response, request);
    return response;
  }

  const nonce = randomBytes(16).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDevelopment: process.env.NODE_ENV === "development",
  });
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const isCustomDomainRoot =
    Boolean(hostname) && !isApplicationHost && pathname === "/";

  // Carry the normalized original custom host in the internal route itself.
  // Next preserves rewrite path params reliably even when the rewritten request
  // observes the application server Host value.
  const response =
    isCustomDomainRoot && hostname
      ? NextResponse.rewrite(
          new URL(
            `${INTERNAL_CUSTOM_DOMAIN_PATH}/${encodeURIComponent(hostname)}`,
            request.url,
          ),
          { request: { headers: requestHeaders } },
        )
      : NextResponse.next({
          request: { headers: requestHeaders },
        });

  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  applyTransportSecurity(response, request);

  return response;
}

function notFoundResponse() {
  return new NextResponse("Not Found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function applyTransportSecurity(response: NextResponse, request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    isConfiguredApplicationHost(request.nextUrl.hostname)
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}

function isConfiguredApplicationHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  const configured = (
    process.env.LINKZZZ_APP_HOSTS ?? "linkzzz.com,www.linkzzz.com"
  )
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
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
