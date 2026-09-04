import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";
import {
  customDomainErrorStatus,
  isCustomDomainError,
} from "@/server/domains/custom-domain-errors";
import { releaseCustomDomainAsAdmin } from "@/server/domains/custom-domain-service";
import { hasValidRequestOrigin } from "@/server/security/request";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin.", code: "INVALID_REQUEST_ORIGIN" },
      { status: 403 },
    );
  }

  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json(
      { error: "Administrator access required.", code: "ADMIN_ACCESS_REQUIRED" },
      { status: 403 },
    );
  }
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required.", code: "AUTHENTICATION_REQUIRED" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  try {
    await releaseCustomDomainAsAdmin(session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isCustomDomainError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: customDomainErrorStatus(error.code) },
      );
    }

    console.error("Admin custom domain release failed.", {
      actorUserId: session.user.id,
      customDomainId: id,
      error,
    });
    return NextResponse.json(
      { error: "Custom domain release failed.", code: "DOMAIN_RELEASE_FAILED" },
      { status: 500 },
    );
  }
}
