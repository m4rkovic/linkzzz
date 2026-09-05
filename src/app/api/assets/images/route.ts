import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/server/auth/request-session";
import { getAssetStorage } from "@/server/assets/storage-factory";
import { InvalidImageError, type AssetStorage, type StoredAsset } from "@/server/assets/asset-storage";
import { AssetStorageQuotaError } from "@/server/business/asset-quota";
import { getRequestCorrelationId, logServerError, logServerWarning } from "@/server/observability/server-logger";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { checkRateLimit, IMAGE_UPLOAD_RATE_LIMIT } from "@/server/security/rate-limit";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["AVATAR", "COVER", "LINK_IMAGE"]);

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  const requestId = getRequestCorrelationId(request.headers);
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

  const logContext = {
    requestId,
    actorUserId: session.user.id,
    smartLinkId,
    assetType: type,
    mimeType: file.type,
    sizeBytes: file.size,
  };

  const bytes = new Uint8Array(await file.arrayBuffer());
  let stored: StoredAsset;
  const storage = await getAssetStorage();
  try {
    stored = await storage.storeImage(session.user.id, bytes, file.type);
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 },
      );
    }

    logServerError("asset.upload.storage_failed", error, logContext);
    return NextResponse.json(
      { error: "Upload failed.", code: "ASSET_UPLOAD_FAILED" },
      { status: 500 },
    );
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
  } catch (error) {
    await removeStoredAssetSafely(storage, stored.storageKey, {
      ...logContext,
      reason: "persistence_failed",
    });

    if (error instanceof AssetStorageQuotaError) {
      return NextResponse.json(
        {
          error: "Your account asset storage quota has been reached.",
          code: error.code,
          limitBytes: error.limitBytes,
          usedBytes: error.usedBytes,
          requestedBytes: error.requestedBytes,
        },
        { status: 413 },
      );
    }

    logServerError("asset.upload.persistence_failed", error, logContext);
    return NextResponse.json(
      { error: "Could not save uploaded image.", code: "ASSET_PERSISTENCE_FAILED" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  }

  const requestId = getRequestCorrelationId(request.headers);
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
    logServerWarning("asset.cleanup.persistence_unavailable", {
      requestId,
      actorUserId: session.user.id,
    });
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
  const cleanupResults = await Promise.allSettled(
    removed.map((asset) => storage.remove(asset.storageKey)),
  );
  cleanupResults.forEach((result, index) => {
    if (result.status !== "rejected") return;
    logServerError("asset.cleanup.storage_remove_failed", result.reason, {
      requestId,
      actorUserId: session.user.id,
      smartLinkId: body.smartLinkId,
      assetId: removed[index]?.id,
    });
  });
  return new NextResponse(null, { status: 204 });
}

async function removeStoredAssetSafely(
  storage: AssetStorage,
  storageKey: string,
  context: Record<string, unknown>,
) {
  try {
    await storage.remove(storageKey);
  } catch (error) {
    logServerError("asset.cleanup.storage_remove_failed", error, context);
  }
}
