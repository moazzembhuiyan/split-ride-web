import { useI18n } from "./context";

export function useT() {
  return useI18n().t;
}
