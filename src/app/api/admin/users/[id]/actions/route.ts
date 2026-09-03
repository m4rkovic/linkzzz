import { NextRequest, NextResponse } from "next/server";

import { isPlanId } from "@/features/plans/plan-catalog";
import {
  isAdminAccountAction,
  performAdminAccountAction,
} from "@/server/admin/admin-account-service";
import {
  isAdminSmartLinkAction,
  performAdminSmartLinkAction,
} from "@/server/admin/admin-smartlink-service";
import {
  isAdminSubscriptionAction,
  performAdminSubscriptionAction,
} from "@/server/admin/admin-subscription-service";
import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";
import { hasValidRequestOrigin } from "@/server/security/request";
import type { AdminUserAction } from "@/types/admin-api";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isAdminUserAction(body)) {
    return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
  }

  const { id } = await context.params;
  try {
    const result = isAdminSubscriptionAction(body)
      ? await performAdminSubscriptionAction(session, id, body)
      : isAdminAccountAction(body)
        ? await performAdminAccountAction(session, id, body)
        : isAdminSmartLinkAction(body)
          ? await performAdminSmartLinkAction(session, id, body)
          : null;

    if (!result) {
      return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin action failed." },
      { status: 400 },
    );
  }
}

function isAdminUserAction(value: unknown): value is AdminUserAction {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  switch (body.type) {
    case "RENEW":
      return [1, 3, 6, 12].includes(Number(body.months));
    case "CHANGE_PLAN":
      return isPlanId(body.plan);
    case "SET_SMART_LINK_STATUS":
      return typeof body.smartLinkId === "string" &&
        (body.status === "PUBLISHED" || body.status === "DISABLED");
    case "SUSPEND":
      return body.reason === undefined || typeof body.reason === "string";
    case "STOP_RENEWAL":
    case "RESUME_RENEWAL":
    case "STOP_IMMEDIATELY":
    case "REACTIVATE":
    case "RESET_PASSWORD":
      return true;
    default:
      return false;
  }
}
