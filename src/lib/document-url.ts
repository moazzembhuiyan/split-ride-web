function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  const obj = asRecord(value);
  if (!obj) return undefined;
  for (const key of ["url", "signedUrl", "href", "path"]) {
    if (typeof obj[key] === "string" && obj[key].trim()) {
      return String(obj[key]).trim();
    }
  }
  return undefined;
}

/** Every URL in a document field that may be a string, an object or a list. */
export function documentUrls(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : [value];
  return entries.map(pickUrl).filter((url) => url !== undefined);
}

export function firstNonEmpty(
  ...values: Array<string | undefined | null>
): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}
