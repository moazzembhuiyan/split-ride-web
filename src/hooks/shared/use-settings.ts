"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsService } from "@/services/settings.service";
import type { GeneralSettings, SettingKey, UpdateTermsPayload } from "@/types/settings.types";

export const settingsKeys = {
  generals: ["settings", "generals"] as const,
  byKey: (key: SettingKey) => ["settings", key] as const,
};

export function useGeneralSettings() {
  return useQuery({
    queryKey: settingsKeys.generals,
    queryFn: () => settingsService.getGenerals(),
  });
}

export function useUpdateGeneralSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<GeneralSettings>) => settingsService.updateGenerals(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.generals }),
  });
}

export function useSettingByKey(key: SettingKey) {
  return useQuery({
    queryKey: settingsKeys.byKey(key),
    queryFn: () => settingsService.getByKey(key),
  });
}

export function useUpdateSettingByKey(key: SettingKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTermsPayload) => settingsService.updateByKey(key, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.byKey(key) }),
  });
}
