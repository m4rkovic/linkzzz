export function buildDuplicateTitle(title: string) {
  const suffix = " copy";
  const base = title.trim() || "SmartLink";
  return `${base.slice(0, Math.max(1, 120 - suffix.length))}${suffix}`;
}

export function duplicateSlugCandidates(slug: string, limit = 100) {
  const normalized = slug.trim().toLowerCase();
  const candidates: string[] = [];
  for (let index = 1; index <= limit; index += 1) {
    const suffix = index === 1 ? "-copy" : `-copy-${index}`;
    const base = normalized.slice(0, Math.max(1, 40 - suffix.length)).replace(/[-_]+$/g, "");
    candidates.push(`${base}${suffix}`);
  }
  return candidates;
}

export function canCustomerDeleteSmartLink(status: "DRAFT" | "PUBLISHED" | "DISABLED") {
  return status === "DRAFT";
}
