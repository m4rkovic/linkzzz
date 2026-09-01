import { NextRequest, NextResponse } from "next/server";

import { resolveSessionToken } from "@/server/auth/auth-service";
import {
  getOrCreateVersionedProfileForUser,
  updateOwnProfile,
} from "@/server/profile/profile-service";
import { isValidProfileRevision } from "@/server/profile/profile-revision";
import { getSessionCookieName } from "@/server/security/session-cookie";
import { hasValidRequestOrigin } from "@/server/security/request";

const MAX_PROFILE_BODY_BYTES = 512_000;

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const record = await getOrCreateVersionedProfileForUser(session.user.id);
  if (!record) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_PROFILE_BODY_BYTES) {
    return NextResponse.json({ error: "Profile payload is too large." }, { status: 413 });
  }

  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isProfileUpdateBody(body)) {
    return NextResponse.json(
      { error: "Profile and revision are required." },
      { status: 400 },
    );
  }

  const result = await updateOwnProfile(session, body.profile, body.revision);

  if (!result.ok) {
    const status =
      result.code === "PROFILE_DISABLED"
        ? 403
        : result.code === "PROFILE_CONFLICT"
          ? 409
          : result.code === "SLUG_TAKEN"
            ? 409
            : result.code === "LINK_LIMIT_REACHED"
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

function isProfileUpdateBody(
  value: unknown,
): value is { profile: unknown; revision: number } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return "profile" in body && isValidProfileRevision(body.revision);
}

async function getSession(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  return resolveSessionToken(token);
}
