import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";
import { createAdminUser, listAdminUsers } from "@/server/admin/admin-service";
import { hasValidRequestOrigin } from "@/server/security/request";

export async function GET() {
  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  return NextResponse.json({ users: await listAdminUsers() });
}

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isCreateUserBody(body)) {
    return NextResponse.json({ error: "Invalid customer data." }, { status: 400 });
  }

  try {
    const result = await createAdminUser(session, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create customer." },
      { status: 400 },
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
    (body.plan === "PREMIUM" || body.plan === "PREMIUM_PLUS") &&
    typeof body.periodStart === "string" &&
    typeof body.periodEnd === "string" &&
    typeof body.autoRenew === "boolean" &&
    typeof body.mustChangePassword === "boolean"
  );
}
