/** Rejects ".", "--", "1" and the like; accepts any script. */
export function isMeaningfulAddress(value: string): boolean {
  const letters = value.match(/\p{L}/gu)?.length ?? 0;
  const digits = value.match(/\p{N}/gu)?.length ?? 0;
  const distinct = new Set(value.toLowerCase().match(/[\p{L}\p{N}]/gu)).size;
  return letters >= 2 && letters + digits >= 3 && distinct >= 2;
}
