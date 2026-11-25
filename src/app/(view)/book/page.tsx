"use client";
import {
  Calendar01Icon,
  Clock01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";
import { z } from "zod";
import AnimatedTabsDemo from "@/components/shadcn-studio/tabs/tabs-27";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/i18n";
import { isInCyprus } from "@/lib/cyprus";
import {
  earliestPickup,
  isBookingFrequencyOk,
  isPickupInBookingWindow,
  settingsMap,
} from "@/lib/general-settings";
import { clearPendingPayment } from "@/lib/pending-payment";
import { forgetRideSubmits } from "@/lib/ride-socket";
import { toRideClock } from "@/lib/ride-time";
import { cn } from "@/lib/utils";
import { type BookingIntent, useBookingStore } from "@/store/booking-store";
import { useMyBookings } from "@/hooks/booking/use-booking";
import { useGeneralSettings } from "@/hooks/shared/use-settings";

const bookSchema = z.object({
  pickup: z.string().min(1, "Enter a pickup location"),
  dropoff: z.string().min(1, "Enter a destination"),
  hasDestCoords: z.boolean().refine((v) => v, {
    message: "Select destination from suggestions or pin it on the map",
  }),
});

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatLocalYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DEFAULT_TIME = "08:00";

/** Today in Cyprus. */
function minDateFor() {
  return parseLocalYmd(toRideClock(Date.now()).date) ?? new Date();
}

export default function Page() {
  const t = useT();
  const router = useRouter();
  const hasHydrated = useBookingStore((s) => s.hasHydrated);
  const request = useBookingStore((s) => s.request);
  const intent = useBookingStore((s) => s.intent);
  const paid = useBookingStore((s) => s.paid);
  const setRequest = useBookingStore((s) => s.setRequest);
  const patchLocation = useBookingStore((s) => s.patchLocation);
  const setIntent = useBookingStore((s) => s.setIntent);
  const setJoinRideId = useBookingStore((s) => s.setJoinRideId);
  const resetInFlight = useBookingStore((s) => s.resetInFlight);
  const resetBooking = useBookingStore((s) => s.reset);

  const tab: BookingIntent = intent ?? "find";
  const pickup = request.pickup?.address ?? "";
  const dropoff = request.destination?.address ?? "";
  const timeChosen = useBookingStore((s) => s.timeChosen);
  const setTimeChosen = useBookingStore((s) => s.setTimeChosen);
  const seats = request.seats ?? 1;
  const luggage = request.luggageCounts ?? 0;
  const { data: settingsData } = useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const rideType = tab === "private" ? "private" : "split";
  const minDate = minDateFor();
  const requestedDate = parseLocalYmd(request.departureDate ?? "");

  // Until the rider picks a time it follows the clock, so a form left open
  // never ends up in the past.
  function pickupNow(): { date: string; time: string } {
    const chosenDate = formatLocalYmd(
      requestedDate && requestedDate >= minDate ? requestedDate : minDate,
    );
    if (timeChosen && request.departureTime) {
      return { date: chosenDate, time: request.departureTime };
    }
    const earliest = earliestPickup(rideType, generals);
    return chosenDate > earliest.date
      ? { date: chosenDate, time: DEFAULT_TIME }
      : earliest;
  }

  const [, tick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  const pickupTime = pickupNow();
  const time = pickupTime.time;
  const date = parseLocalYmd(pickupTime.date) ?? minDate;
  const [dateOpen, setDateOpen] = React.useState(false);
  const { data: myBookings } = useMyBookings({ limit: 20 });

  React.useLayoutEffect(() => {
    if (!hasHydrated || !paid) return;
    resetBooking();
  }, [hasHydrated, paid, resetBooking]);

  const TABS = [
    { name: t("book.findTab"), value: "find" },
    { name: t("book.startTab"), value: "start" },
    { name: t("book.privateTab"), value: "private" },
  ] as const;

  function handleTab(next: BookingIntent) {
    setIntent(next);
    const type = next === "private" ? "private" : "split";
    const nextMin = minDateFor();
    const current = parseLocalYmd(request.departureDate ?? "") ?? date;
    setRequest({
      type,
      departureDate:
        current < nextMin ? formatLocalYmd(nextMin) : formatLocalYmd(current),
    });
  }

  async function handleBook() {
    const destLat = request.destination?.lat ?? 0;
    const validation = bookSchema.safeParse({
      pickup,
      dropoff,
      hasDestCoords: destLat !== 0,
    });
    if (!validation.success) {
      toast.error(
        validation.error.issues[0]?.message ??
          "Please fill in all required fields",
      );
      return;
    }

    let pickupLat = request.pickup?.lat ?? 0;
    let pickupLng = request.pickup?.lng ?? 0;

    if (pickupLat === 0 && pickupLng === 0) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }),
        );
        pickupLat = pos.coords.latitude;
        pickupLng = pos.coords.longitude;
      } catch {
        toast.error("Enable location access or pin your pickup location");
      }
    }

    const destLng = request.destination?.lng ?? 0;

    if (
      (pickupLat && pickupLng && !isInCyprus(pickupLat, pickupLng)) ||
      (destLat && destLng && !isInCyprus(destLat, destLng))
    ) {
      toast.error("Pickup and destination must be in Cyprus.");
      return;
    }

    const { date: departureDate, time: departureTime } = pickupNow();
    const windowCheck = isPickupInBookingWindow(
      rideType,
      departureDate,
      departureTime,
      generals,
    );
    if (!windowCheck.ok) {
      toast.error(windowCheck.message);
      return;
    }

    const latestBooking = (myBookings?.data ?? [])
      .filter((b) => {
        const status = (b.bookingStatus ?? "").toLowerCase();
        return status !== "cancelled" && status !== "canceled";
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
    const freqCheck = isBookingFrequencyOk(latestBooking?.createdAt, generals);
    if (!freqCheck.ok) {
      toast.error(freqCheck.message);
      return;
    }

    const partySeats = tab === "find" ? seats : 1;
    const partyLuggage = tab === "find" ? luggage : 0;

    resetInFlight();
    clearPendingPayment();
    forgetRideSubmits();
    setJoinRideId(null);
    setIntent(tab);
    setRequest({
      pickup: {
        lat: pickupLat,
        lng: pickupLng,
        address: pickup || "Current location",
      },
      destination: { lat: destLat, lng: destLng, address: dropoff },
      type: rideType,
      departureDate,
      departureTime,
      seats: partySeats,
      passengers: partySeats,
      luggageCounts: partyLuggage,
      malePassengers: 0,
      femalePassengers: 0,
    });

    router.push("/book/info");
  }

  if (!hasHydrated) {
    return (
      <div className="container mx-auto">
        <div className="h-full w-full py-8 lg:py-12 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="h-full w-full py-8 lg:py-12 flex flex-col items-center justify-start gap-4 px-4 sm:px-8 lg:px-12">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t("book.title")}</h1>
        </div>

        <div className="w-full space-y-2">
          <AnimatedTabsDemo
            tabs={TABS as unknown as { name: string; value: string }[]}
            value={tab}
            setValue={(v) => handleTab(v as BookingIntent)}
            defaultValue="find"
          />
          <div className="font-medium text-sm">
            <span className="text-primary font-semibold">
              {t("book.saveUpTo")}
            </span>{" "}
            {t("book.sharingMsg")}
          </div>
        </div>

        <div className="w-full">
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel className="mb-0">
                  {t("book.pickupLabel")}
                </FieldLabel>
                <Link
                  href="/book/pin?for=pickup"
                  className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                >
                  📍 {t("book.pinLocation")}
                </Link>
              </div>
              <InputGroup className="overflow-visible">
                <InputGroupAddon>
                  <svg
                    className="size-4 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </InputGroupAddon>
                <AddressAutocomplete
                  value={pickup}
                  onChange={(address) => patchLocation("pickup", { address })}
                  onCoordinates={(lat, lng) =>
                    patchLocation("pickup", { lat, lng })
                  }
                />
              </InputGroup>
            </Field>

            <Field>
              <div className="flex items-center justify-between mb-1">
                <FieldLabel className="mb-0">
                  {t("book.dropoffLabel")}
                </FieldLabel>
                <Link
                  href="/book/pin?for=destination"
                  className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                >
                  📍 {t("book.pinLocation")}
                </Link>
              </div>
              <InputGroup className="overflow-visible">
                <InputGroupAddon>
                  <HugeiconsIcon
                    icon={Location01Icon}
                    className="text-muted-foreground"
                  />
                </InputGroupAddon>
                <AddressAutocomplete
                  value={dropoff}
                  onChange={(address) =>
                    patchLocation("destination", { address })
                  }
                  onCoordinates={(lat, lng) =>
                    patchLocation("destination", { lat, lng })
                  }
                />
              </InputGroup>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>{t("book.dateLabel")}</FieldLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12 w-full text-left text-sm font-medium hover:bg-input/70 transition-colors"
                    >
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        className="size-4 text-muted-foreground shrink-0"
                      />
                      <span>{formatDate(date)}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => {
                        if (d) {
                          setRequest({ departureDate: formatLocalYmd(d) });
                          setDateOpen(false);
                        }
                      }}
                      disabled={{ before: minDate }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel>{t("book.timeLabel")}</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <HugeiconsIcon icon={Clock01Icon} />
                  </InputGroupAddon>
                  <InputGroupInput
                    value={time}
                    type="time"
                    step="3600"
                    onChange={(e) => {
                      setTimeChosen(e.target.value !== "");
                      setRequest({ departureTime: e.target.value });
                    }}
                    placeholder="Select time"
                  />
                </InputGroup>
              </Field>
            </div>

            {tab === "find" && (
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Passengers</FieldLabel>
                  <div className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12">
                    <button
                      type="button"
                      onClick={() =>
                        setRequest({
                          seats: Math.max(1, seats - 1),
                          passengers: Math.max(1, seats - 1),
                          malePassengers: 0,
                          femalePassengers: 0,
                        })
                      }
                      className="text-primary"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-medium">
                      {seats}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRequest({
                          seats: Math.min(7, seats + 1),
                          passengers: Math.min(7, seats + 1),
                          malePassengers: 0,
                          femalePassengers: 0,
                        })
                      }
                      className="text-primary"
                    >
                      +
                    </button>
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Luggage</FieldLabel>
                  <div className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12">
                    <button
                      type="button"
                      onClick={() =>
                        setRequest({
                          luggageCounts: Math.max(0, luggage - 1),
                        })
                      }
                      className="text-primary"
                    >
                      −
                    </button>
                    <span className="flex-1 text-center font-medium">
                      {luggage}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setRequest({
                          luggageCounts: Math.min(6, luggage + 1),
                        })
                      }
                      className="text-primary"
                    >
                      +
                    </button>
                  </div>
                </Field>
              </div>
            )}

            <Button
              className={cn(
                "w-full h-12",
                tab === "find" || tab === "private"
                  ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary"
                  : "",
              )}
              type="button"
              variant={
                tab === "private" || tab === "find" ? "outline" : "default"
              }
              onClick={handleBook}
            >
              {t("book.bookRide")}
            </Button>
          </FieldGroup>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {t("book.issueMsg")}{" "}
          <Link
            href="/help"
            className="text-primary font-semibold hover:underline"
          >
            {t("book.support")}
          </Link>
        </p>
      </div>
    </div>
  );
}
