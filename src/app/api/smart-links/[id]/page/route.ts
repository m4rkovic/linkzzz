import { NextRequest, NextResponse } from "next/server";

import { resolveSessionToken } from "@/server/auth/auth-service";
import {
  getVersionedPageForSmartLink,
  updateOwnSmartLinkPage,
} from "@/server/profile/profile-service";
import { isValidProfileRevision } from "@/server/profile/profile-revision";
import { hasValidRequestOrigin } from "@/server/security/request";
import { getSessionCookieName } from "@/server/security/session-cookie";

const MAX_PAGE_BODY_BYTES = 512_000;
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await getVersionedPageForSmartLink(session, id);
  if (!record) {
    return NextResponse.json({ error: "Landing page not found." }, { status: 404 });
  }
  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_PAGE_BODY_BYTES) {
    return NextResponse.json({ error: "Page payload is too large." }, { status: 413 });
  }

  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    profile?: unknown;
    revision?: unknown;
  } | null;
  if (!body || !("profile" in body) || !isValidProfileRevision(body.revision)) {
    return NextResponse.json(
      { error: "Page profile and revision are required." },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  const result = await updateOwnSmartLinkPage(
    session,
    id,
    body.profile,
    body.revision,
  );
  if (!result.ok) {
    const status =
      result.code === "PROFILE_DISABLED"
        ? 403
        : result.code === "PROFILE_CONFLICT" || result.code === "LINK_LIMIT_REACHED"
          ? 409
          : 400;
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    profile: result.profile,
    revision: result.revision,
  });
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return resolveSessionToken(token);
}
