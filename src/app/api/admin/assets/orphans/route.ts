import { NextRequest, NextResponse } from "next/server";

import { sweepOrphanedAssets } from "@/server/assets/orphan-sweeper";
import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";
import { hasValidRequestOrigin } from "@/server/security/request";

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin.", code: "INVALID_REQUEST_ORIGIN" },
      { status: 403 },
    );
  }

  const session = await getCurrentSession();
  let admin: ReturnType<typeof requireAdmin>;
  try {
    admin = requireAdmin(session?.principal);
  } catch {
    return NextResponse.json(
      { error: "Administrator access required.", code: "ADMIN_ACCESS_REQUIRED" },
      { status: 403 },
    );
  }

  let body: unknown = null;
  if (request.headers.get("content-type")?.includes("application/json")) {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body.", code: "INVALID_REQUEST_BODY" },
        { status: 400 },
      );
    }
  }
  const limit = body && typeof body === "object" && !Array.isArray(body) &&
    "limit" in body && typeof body.limit === "number"
    ? body.limit
    : 200;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1_000) {
    return NextResponse.json(
      { error: "Sweep limit must be an integer between 1 and 1000.", code: "INVALID_ADMIN_INPUT" },
      { status: 400 },
    );
  }

  const result = await sweepOrphanedAssets(limit, admin.userId);
  return NextResponse.json(result);
}
