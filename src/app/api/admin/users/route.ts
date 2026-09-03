import { NextRequest, NextResponse } from "next/server";

import { isPlanId } from "@/features/plans/plan-catalog";
import {
  adminErrorStatus,
  isAdminError,
} from "@/server/admin/admin-errors";
import { createAdminUser, listAdminUsers } from "@/server/admin/admin-service";
import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";
import { hasValidRequestOrigin } from "@/server/security/request";

export async function GET() {
  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json(
      { error: "Administrator access required.", code: "ADMIN_ACCESS_REQUIRED" },
      { status: 403 },
    );
  }

  return NextResponse.json({ users: await listAdminUsers() });
}

export async function POST(request: NextRequest) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", code: "INVALID_REQUEST_BODY" },
      { status: 400 },
    );
  }

  if (!isCreateUserBody(body)) {
    return NextResponse.json(
      { error: "Invalid customer data.", code: "INVALID_ADMIN_INPUT" },
      { status: 400 },
    );
  }

  try {
    const result = await createAdminUser(session, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (isAdminError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: adminErrorStatus(error.code) },
      );
    }

    console.error("Admin customer creation failed.", {
      username: body.username,
      error,
    });
    return NextResponse.json(
      { error: "Unable to create customer.", code: "ADMIN_CREATE_CUSTOMER_FAILED" },
      { status: 500 },
    );
  }
}

function isCreateUserBody(value: unknown): value is Parameters<typeof createAdminUser>[1] {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    typeof body.displayName === "string" &&
    typeof body.username === "string" &&
    typeof body.email === "string" &&
    typeof body.slug === "string" &&
    typeof body.password === "string" &&
    isPlanId(body.plan) &&
    typeof body.periodStart === "string" &&
    typeof body.periodEnd === "string" &&
    typeof body.autoRenew === "boolean" &&
    typeof body.mustChangePassword === "boolean"
  );
}
