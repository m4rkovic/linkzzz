import { NextResponse } from "next/server";

import { getAdminUser } from "@/server/admin/admin-service";
import { getCurrentSession } from "@/server/auth/current-session";
import { requireAdmin } from "@/server/auth/guards";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();
  try {
    requireAdmin(session?.principal);
  } catch {
    return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  }

  const { id } = await context.params;
  const result = await getAdminUser(id);
  if (!result) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json(result);
}
