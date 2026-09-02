import "server-only";

import { getServerDependencies } from "@/server/persistence/dependencies";
import { resolveScheduleWindow } from "@/features/scheduling/schedule";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";
import { getPublicSmartLinkBySlug } from "@/server/smart-links/smart-link-service";

export type LeadCaptureResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "INVALID_EMAIL" | "UNAVAILABLE"; message: string };

export async function captureEmailLead(
  slug: string,
  blockId: string,
  rawEmail: string,
): Promise<LeadCaptureResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, code: "INVALID_EMAIL", message: "Enter a valid email address." };
  }

  const [smartLink, profile] = await Promise.all([
    getPublicSmartLinkBySlug(slug),
    getPublicProfileBySlug(slug),
  ]);
  if (!smartLink || smartLink.type !== "LANDING_PAGE" || !profile) {
    return { ok: false, code: "NOT_FOUND", message: "Landing page not found." };
  }

  const block = profile.contentBlocks.find(
    (candidate) =>
      candidate.id === blockId &&
      candidate.visible &&
      candidate.type === "EMAIL_CAPTURE" &&
      resolveScheduleWindow(candidate) === "ACTIVE",
  );
  if (!block) {
    return { ok: false, code: "NOT_FOUND", message: "Email capture block not found." };
  }

  const dependencies = await getServerDependencies();
  if (!dependencies.leadSubmissions) {
    return { ok: false, code: "UNAVAILABLE", message: "Lead capture is unavailable." };
  }

  await dependencies.leadSubmissions.create({
    smartLinkId: smartLink.id,
    blockId,
    email,
  });
  return { ok: true };
}

function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
