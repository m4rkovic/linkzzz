import { NextRequest, NextResponse } from "next/server";
import { resolveSessionToken } from "@/server/auth/auth-service";
import { getAssetStorage } from "@/server/assets/storage-factory";
import type { StoredAsset } from "@/server/assets/asset-storage";
import { getServerDependencies } from "@/server/persistence/dependencies";
import { getRequestIp, hasValidRequestOrigin } from "@/server/security/request";
import { getSessionCookieName } from "@/server/security/session-cookie";
import { IMAGE_UPLOAD_RATE_LIMIT, InMemoryRateLimiter } from "@/server/security/rate-limit";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["AVATAR", "COVER", "LINK_IMAGE"]);
const uploadLimiter = new InMemoryRateLimiter();

export async function POST(request: NextRequest) {
  if (!hasValidRequestOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const session = await resolveSessionToken(request.cookies.get(getSessionCookieName())?.value);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (session.user.role !== "CUSTOMER") return NextResponse.json({ error: "Customer account required." }, { status: 403 });
  const rateLimit = uploadLimiter.check(`${getRequestIp(request)}:${session.user.id}`, IMAGE_UPLOAD_RATE_LIMIT);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many uploads. Try again later.", retryAfterMs: rateLimit.retryAfterMs }, { status: 429 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const type = form?.get("type");
  if (!(file instanceof File) || typeof type !== "string" || !TYPES.has(type)) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
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
    const asset = await repositories.assets.createForUser(session.user.id, {
      type: type as "AVATAR" | "COVER" | "LINK_IMAGE",
      fileName: file.name.slice(0, 255) || stored.fileName,
      storageKey: stored.storageKey,
      mimeType: file.type,
      sizeBytes: file.size,
      width: null,
      height: null,
    });
    return NextResponse.json({ assetId: asset.id, url: stored.publicUrl });
  } catch {
    await storage.remove(stored.storageKey);
    return NextResponse.json({ error: "Could not save uploaded image." }, { status: 500 });
  }
}
