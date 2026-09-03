export function normalizeGa4MeasurementId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return /^G-[A-Z0-9]{4,30}$/.test(normalized) ? normalized : null;
}

export function normalizeMetaPixelId(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^\d{5,30}$/.test(normalized) ? normalized : null;
}
