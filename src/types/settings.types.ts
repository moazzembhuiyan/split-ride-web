export type SettingKey = "userTramsAndCondition" | "providerTramsAndCondition";

export interface GeneralSettings {
  bookingMaxDaysAhead: number;
  splitRideMinBookingHours: number;
  splitRideMinDistanceKm: number;
  splitRidePickupMatchRadiusKm: number;
  splitRideDestinationMatchRadiusKm: number;
  splitRideMatchingTimeWindowMinutes: number;
  splitRideRefundRestrictionHours: number;
  privateRideMinBookingHours: number;
  privateRideRefundRestrictionHours: number;
  matchingNoDriverNotifyHours: number;
  matchingLastNotifyHours: number;
  cancellationFreeWindowHours: number;
  cancellationPercentage50Hours: number;
  cancellationFeePercent: number;
  lateCancellationFeePercent: number;
  waitingReminderIntervals: number;
  waitingTimeMinutes: number;
  dayFareInitialCharge: number;
  dayFarePerKMRate: number;
  dayFareWaitingCharge: number;
  nightFareInitialCharge: number;
  nightFarePerKMRate: number;
  nightFareWaitingCharge: number;
  holidayIncreasePercentage: number;
  perLuggageCharge: number;
  fivePassengerExtraChargePercentage: number;
  sixPassengerExtraChargePercentage: number;
  baseFare: number;
  splitRideMinimumFare: number;
  splitRideMatchedSurchargePercent: number;
  splitRideMatchedSurchargePercent3: number;
  splitRideMaxMatchedRiders: number;
  platformVat: number;
  platformCommissionPercent: number;
  driverPlatformFeePercent: number;
  driverVatPercent: number;
  fareRoundingBracket: number;
  supportEmail: string;
  waitNoticeFeeAmount: number;
  waitNoticeMaxMinutes: number;
  tripStartEarlyWindowMinutes: number;
}

export interface GeneralSettingEntry {
  _id: string;
  key: string;
  value: string | number;
  /** Fixed by the backend: shown to admins but not accepted on save. */
  readOnly?: boolean;
}

export interface GeneralSettingsEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface TermsAndConditionSetting {
  key: SettingKey;
  value: string;
}

export interface UpdateTermsPayload {
  value: string;
}
