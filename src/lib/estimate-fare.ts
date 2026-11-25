import { settingNumber } from "@/lib/general-settings";
import { toRideClock } from "@/lib/ride-time";
import type { FareBreakdown } from "@/types/ride.types";

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function isNightFare(at: Date): boolean {
  const hour = Number(toRideClock(at.getTime()).time.slice(0, 2));
  return hour >= 22 || hour < 6;
}

/**
 * Client fare estimate shown before payment.
 *
 * Formula:
 *   net = initial + (perKm * km) + luggage + perPassengerExtra
 *   groupExtra = net * fivePassengerExtraChargePercentage / 100 for 5 seats,
 *                net * sixPassengerExtraChargePercentage / 100 for 6 or more
 *   vat = (net + groupExtra) * platformVat / 100
 *   total = max(net + groupExtra + vat, baseFare)   // default min €20
 *
 * Split Ride matching fee (splitRideMatchedSurchargePercent) is NOT added here.
 * The first passenger pays this initial amount; the fee is applied later when
 * another passenger is matched (backend / refund window).
 */
export function estimateRideFare(opts: {
  distanceKm: number;
  seats: number;
  luggageCounts: number;
  departure: Date;
  settings: Record<string, string | number>;
}): { estimatedFare: number; fareBreakdown: FareBreakdown } {
  const { distanceKm, seats, luggageCounts, departure, settings } = opts;
  const night = isNightFare(departure);
  const initialCharge = settingNumber(
    settings,
    night ? "nightFareInitialCharge" : "dayFareInitialCharge",
    0,
  );
  const perKmCharge = settingNumber(
    settings,
    night ? "nightFarePerKMRate" : "dayFarePerKMRate",
    0,
  );
  const totalKmCharge = money(perKmCharge * distanceKm);
  const luggageCharge = money(
    luggageCounts * settingNumber(settings, "perLuggageCharge", 0),
  );
  const extraSeats = Math.max(0, seats - 1);
  const passengerCountExtra = money(
    extraSeats * settingNumber(settings, "perPassengerExtraCharge", 0),
  );
  const fivePassengerExtraChargePercentage =
    seats === 5
      ? settingNumber(settings, "fivePassengerExtraChargePercentage", 0)
      : 0;
  const sixPassengerExtraChargePercentage =
    seats >= 6
      ? settingNumber(settings, "sixPassengerExtraChargePercentage", 0)
      : 0;
  const net =
    initialCharge +
    totalKmCharge +
    luggageCharge +
    passengerCountExtra;
  const fivePassengerExtraCharge = money(
    net * (fivePassengerExtraChargePercentage / 100),
  );
  const sixExtra = money(net * (sixPassengerExtraChargePercentage / 100));
  const groupExtra = fivePassengerExtraCharge + sixExtra;
  const vatPct = settingNumber(settings, "platformVat", 0);
  const vat = money((net + groupExtra) * (vatPct / 100));
  const rawTotal = money(net + groupExtra + vat);
  const minFare = settingNumber(settings, "baseFare", 20);
  const estimatedFare = money(Math.max(rawTotal, minFare));

  return {
    estimatedFare,
    fareBreakdown: {
      initialCharge,
      perKmCharge,
      totalKmCharge,
      luggageCharge,
      passengerCountExtra,
      holidaySurcharge: 0,
      waitingCharge: 0,
      fivePassengerExtraCharge,
      sixPassengerExtraChargePercentage,
      vat,
      totalFare: estimatedFare,
    },
  };
}
