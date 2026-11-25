export const SUPPORT_EMAIL = "splitridesupport@gmail.com";
export const SUPPORT_PHONE = "+357";

export function supportEmail(
  map?: Record<string, string | number> | null,
): string {
  const raw = map?.supportEmail;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return SUPPORT_EMAIL;
}

export function supportPhone(
  map?: Record<string, string | number> | null,
): string {
  const raw = map?.supportContract;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return SUPPORT_PHONE;
}
