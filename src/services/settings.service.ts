import { howl } from "@/lib/api";
import type {
  GeneralSettingEntry,
  GeneralSettings,
  GeneralSettingsEnvelope,
  SettingKey,
  TermsAndConditionSetting,
  UpdateTermsPayload,
} from "@/types/settings.types";

export const settingsService = {
  getGenerals: () =>
    howl<GeneralSettingsEnvelope<GeneralSettingEntry[]>>("/setting/generals"),

  updateGenerals: (payload: Partial<GeneralSettings>) =>
    howl<GeneralSettingsEnvelope<GeneralSettings>>("/setting/generals", {
      method: "POST",
      body: payload,
    }),

  getByKey: (key: SettingKey) =>
    howl<GeneralSettingsEnvelope<TermsAndConditionSetting>>(
      `/setting?key=${key}`,
    ),

  updateByKey: (key: SettingKey, payload: UpdateTermsPayload) =>
    howl<GeneralSettingsEnvelope<TermsAndConditionSetting>>(`/setting/${key}`, {
      method: "POST",
      body: payload,
    }),
};
