import { NextRequest, NextResponse } from "next/server";
import { resolveSessionToken } from "@/server/auth/auth-service";
import { getAssetStorage } from "@/server/assets/storage-factory";
import type { StoredAsset } from "@/server/assets/asset-storage";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { getSessionCookieName } from "@/server/security/session-cookie";
import { checkRateLimit, IMAGE_UPLOAD_RATE_LIMIT } from "@/server/security/rate-limit";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["AVATAR", "COVER", "LINK_IMAGE"]);

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await resolveSessionToken(request.cookies.get(getSessionCookieName())?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  const rateLimit = await checkRateLimit(`${getRequestIp(request)}:${session.user.id}`, IMAGE_UPLOAD_RATE_LIMIT);
  if (!rateLimit.available) return NextResponse.json({ error: "Upload protection is temporarily unavailable." }, { status: 503 });
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many uploads. Try again later.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const type = form?.get("type");
  const smartLinkId = form?.get("smartLinkId");
  if (
    !(file instanceof File) ||
    typeof type !== "string" ||
    !TYPES.has(type) ||
    typeof smartLinkId !== "string" || smartLinkId.length < 1 || smartLinkId.length > 100
  ) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image must be smaller than 8 MB." }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  let stored: StoredAsset;
  const storage = await getAssetStorage();
  try {
    stored = await storage.storeImage(session.user.id, bytes, file.type);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }

  try {
    const repositories = await getServerDependencies();
    if (!repositories.assets) throw new Error("Asset persistence is unavailable.");
    const assetInput = {
      type: type as "AVATAR" | "COVER" | "LINK_IMAGE",
      fileName: file.name.slice(0, 255) || stored.fileName,
      storageKey: stored.storageKey,
      mimeType: file.type,
      sizeBytes: file.size,
      width: null,
      height: null,
    };
    const asset = await repositories.assets.createForSmartLink(session.user.id, smartLinkId, assetInput);
    return NextResponse.json({ assetId: asset.id, url: stored.publicUrl });
  } catch {
    await storage.remove(stored.storageKey);
    return NextResponse.json({ error: "Could not save uploaded image." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await resolveSessionToken(
    request.cookies.get(getSessionCookieName())?.value,
  );
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    assetIds?: unknown;
    smartLinkId?: unknown;
  } | null;
  if (
    !Array.isArray(body?.assetIds) ||
    body.assetIds.length > 120 ||
    body.assetIds.some(
      (id) => typeof id !== "string" || id.length < 1 || id.length > 100,
    )
  ) {
    return NextResponse.json({ error: "Invalid asset cleanup request." }, { status: 400 });
  }

  const repositories = await getServerDependencies();
  if (!repositories.assets) {
    return NextResponse.json({ error: "Asset persistence is unavailable." }, { status: 503 });
  }
  if (typeof body.smartLinkId !== "string" || body.smartLinkId.length < 1 || body.smartLinkId.length > 100) {
    return NextResponse.json({ error: "Invalid SmartLink asset scope." }, { status: 400 });
  }
  const assetIds = [...new Set(body.assetIds as string[])];
  const removed = await repositories.assets.deleteUnusedForSmartLink(
    session.user.id,
    body.smartLinkId,
    assetIds,
  );
  const storage = await getAssetStorage();
  await Promise.allSettled(
    removed.map((asset) => storage.remove(asset.storageKey)),
  );
  return new NextResponse(null, { status: 204 });
}
