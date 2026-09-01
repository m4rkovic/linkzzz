import { NextRequest, NextResponse } from "next/server";
import { resolveSessionToken } from "@/server/auth/auth-service";
import { addCustomDomain, customDomainDnsInstructions, listCustomDomains, removeCustomDomain, setCustomDomainActive, verifyCustomDomain } from "@/server/domains/custom-domain-service";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { getSessionCookieName } from "@/server/security/session-cookie";
import { CUSTOM_DOMAIN_RATE_LIMIT, InMemoryRateLimiter } from "@/server/security/rate-limit";

const domainLimiter = new InMemoryRateLimiter();

export async function GET(request: NextRequest) {
  const session = await customerSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = domainLimiter.check(`${getRequestIp(request)}:${session.user.id}`, CUSTOM_DOMAIN_RATE_LIMIT);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many domain operations. Try again later.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });
  const domains = await listCustomDomains(session.user.id);
  return NextResponse.json({ domains: domains.map((domain) => ({ ...domain, dns: customDomainDnsInstructions(domain) })) });
}

export async function POST(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;
  const domain = await addCustomDomain(prepared.userId, prepared.domain).catch(toError);
  if (domain instanceof Error) return NextResponse.json({ error: domain.message }, { status: domain.message.includes("already") ? 409 : 400 });
  return NextResponse.json({ domain: { ...domain, dns: customDomainDnsInstructions(domain) } }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;
  const action = prepared.action;
  const operation = action === "VERIFY" ? verifyCustomDomain(prepared.userId, prepared.domain) : action === "ACTIVATE" ? setCustomDomainActive(prepared.userId, prepared.domain, true) : action === "DISABLE" ? setCustomDomainActive(prepared.userId, prepared.domain, false) : Promise.reject(new Error("Invalid domain action."));
  const domain = await operation.catch(toError);
  if (domain instanceof Error) return NextResponse.json({ error: domain.message }, { status: 400 });
  return NextResponse.json({ domain: { ...domain, dns: customDomainDnsInstructions(domain) } });
}

export async function DELETE(request: NextRequest) {
  const prepared = await prepareWrite(request);
  if (prepared instanceof NextResponse) return prepared;
  const result = await removeCustomDomain(prepared.userId, prepared.domain).then(() => null).catch(toError);
  if (result instanceof Error) return NextResponse.json({ error: result.message }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}

async function prepareWrite(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await customerSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const rateLimit = domainLimiter.check(`${getRequestIp(request)}:${session.user.id}`, CUSTOM_DOMAIN_RATE_LIMIT);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many domain operations. Try again later.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });
  const body = await request.json().catch(() => null) as { domain?: unknown; action?: unknown } | null;
  if (typeof body?.domain !== "string") return NextResponse.json({ error: "Domain is required." }, { status: 400 });
  return { userId: session.user.id, domain: body.domain, action: body.action };
}

async function customerSession(request: NextRequest) {
  const session = await resolveSessionToken(request.cookies.get(getSessionCookieName())?.value);
  return session?.user.role === "CUSTOMER" ? session : null;
}

function toError(error: unknown) { return error instanceof Error ? error : new Error("Custom domain operation failed."); }
