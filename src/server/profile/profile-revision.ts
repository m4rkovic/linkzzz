export function isValidProfileRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 1;
}
