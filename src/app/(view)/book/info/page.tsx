"use client";

import { Location01Icon, Navigation03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  Map as RideMap,
  useMap,
} from "@/components/ui/map";
import { Spinner } from "@/components/ui/spinner";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { useSocket } from "@/hooks/shared/use-socket";
import { useT } from "@/i18n";
import { CYPRUS_CENTER } from "@/lib/cyprus";
import { getDrivingRoute } from "@/lib/driving-route";
import {
  settingFlag,
  settingsMap,
} from "@/lib/general-settings";
import { farePayloadFromRequest, quoteRideFare } from "@/lib/request-fare";
import {
  previewSplitIfJoined,
  splitSurchargePercent,
} from "@/lib/split-settlement";
import { SplitSharePreview } from "@/components/booking/split-share-card";
import { useBookingStore } from "@/store/booking-store";
import type { FareBreakdownResponse } from "@/types/ride.types";
import { Card, CardContent } from "@/components/ui/card";
import { FareBreakdownPayload } from "@/types/socket.types";

function RouteLayer({
  pickup,
  destination,
}: {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const { map, isLoaded } = useMap();
  const [coords, setCoords] = useState<[number, number][]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!pickup.lat || !pickup.lng || !destination.lat || !destination.lng)
      return;
    let cancelled = false;

    getDrivingRoute(pickup, destination)
      .then((route) => {
        if (!cancelled) setCoords(route.coordinates);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng]);

  useEffect(() => {
    if (!map || !isLoaded || coords.length < 2) return;
    const lngs = coords.map(([lng]) => lng);
    const lats = coords.map(([, lat]) => lat);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 800 },
    );
  }, [map, isLoaded, coords]);

  if (coords.length < 2) return null;
  return (
    <MapRoute coordinates={coords} color="#7c3aed" width={5} opacity={0.9} />
  );
}

function AddressSummary({
  pickup,
  destination,
}: {
  pickup?: string;
  destination?: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={Navigation03Icon} className="size-5 shrink-0" />
        <span className="text-sm font-medium truncate">
          {pickup || t("book.pickupLabel")}
        </span>
      </div>
      <div className="ml-2.25 border-l-2 border-dashed border-muted-foreground/40 h-5" />
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={Location01Icon} className="size-5 shrink-0" />
        <span className="text-sm font-medium truncate">
          {destination || t("book.dropoffLabel")}
        </span>
      </div>
    </div>
  );
}

function CountStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3 bg-input/50 rounded-4xl px-4 h-12">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="text-primary"
        >
          −
        </button>
        <span className="flex-1 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="text-primary"
        >
          +
        </button>
      </div>
    </Field>
  );
}

function FareRow({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${primary ? "text-primary" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function renderFareBreakdownRows(fareBreakdown: Record<string, unknown>) {
  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatValue = (key: string, value: unknown) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    if (key.includes("Percent") || key.includes("Percentage")) {
      return `${value}%`;
    }
    if (typeof value === "number") {
      return `€${value.toFixed(2)}`;
    }
    return String(value);
  };

  return Object.entries(fareBreakdown)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => (
      <FareRow
        key={key}
        label={formatLabel(key)}
        value={formatValue(key, value)}
      />
    ));
}

export default function Page() {
  const t = useT();
  const router = useRouter();
  const { socket } = useSocket();
  const hasHydrated = useBookingStore((s) => s.hasHydrated);
  const request = useBookingStore((s) => s.request);
  const paid = useBookingStore((s) => s.paid);
  const intent = useBookingStore((s) => s.intent);
  const setRequest = useBookingStore((s) => s.setRequest);

  const pickup = request.pickup;
  const destination = request.destination;
  const seats = request.seats ?? request.malePassengers ?? 1;
  const luggage = request.luggageCounts ?? 0;
  const title =
    intent === "private"
      ? t("book.privateTab")
      : intent === "find"
        ? t("book.findTab")
        : t("book.startTab");
  const { data: settingsData, isFetched: settingsFetched } =
    useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const showGender = settingFlag(generals, "showGender", false);
  const [fare, setFare] = useState<FareBreakdownResponse | null>(null);
  const [fareLoading, setFareLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    // Back from a finished booking starts a new one.
    if (
      paid ||
      !pickup?.lat ||
      !destination?.lat ||
      !request.departureDate ||
      !request.departureTime
    ) {
      router.replace("/book");
    }
  }, [
    hasHydrated,
    paid,
    pickup?.lat,
    destination?.lat,
    request.departureDate,
    request.departureTime,
    router,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!hasHydrated || !settingsFetched) return;
    if (
      !pickup?.lat ||
      !pickup?.lng ||
      !destination?.lat ||
      !destination?.lng ||
      !request.departureDate ||
      !request.departureTime
    ) {
      return;
    }

    const payload = farePayloadFromRequest(request);
    if (!payload) return;

    const updatedPayload = {
      ...payload,
      vehicleType: seats && seats > 4 ? "6-seater" : "4-seater",
    } satisfies FareBreakdownPayload;

    let cancelled = false;
    setFare(null);
    setFareLoading(true);
    const generals = settingsMap(settingsData?.data);

    quoteRideFare({ socket, payload: updatedPayload, settings: generals })
      .then((quoted) => {
        if (cancelled) return;
        setFare(quoted);
        console.log("Fare quoted:", quoted);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFare(null);
      })
      .finally(() => {
        if (!cancelled) setFareLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasHydrated,
    settingsFetched,
    pickup?.lat,
    pickup?.lng,
    destination?.lat,
    destination?.lng,
    seats,
    luggage,
    request.departureDate,
    request.departureTime,
    request.type,
    request.malePassengers,
    request.femalePassengers,
    request.luggageCounts,
    request.passengers,
    request.note,
    settingsData,
    socket,
  ]);

  function handleContinue() {
    if (!fare) return;
    setRequest({
      seats,
      passengers: seats,
      luggageCounts: luggage,
      malePassengers: showGender ? (request.malePassengers ?? seats) : 0,
      femalePassengers: showGender ? (request.femalePassengers ?? 0) : 0,
    });

    router.push("/book/select");
  }

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Spinner />
      </div>
    );
  }

  const center: [number, number] =
    pickup?.lng && destination?.lng
      ? [(pickup.lng + destination.lng) / 2, (pickup.lat + destination.lat) / 2]
      : CYPRUS_CENTER;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(100vh-64px)]">
      <div className="flex flex-col px-8 py-8 gap-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Link>
          <span className="font-semibold text-base">{title}</span>
        </div>

        <div>
          <h2 className="text-xl font-bold">{t("book.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {request.departureDate} · {request.departureTime}
          </p>
        </div>

        <div className="lg:hidden rounded-2xl border border-border bg-muted/10 p-4">
          <AddressSummary
            pickup={pickup?.address}
            destination={destination?.address}
          />
        </div>

        <FieldGroup>
          <CountStepper
            label={t("book.select.passengers")}
            value={seats}
            min={1}
            max={7}
            onChange={(n) =>
              setRequest({
                seats: n,
                malePassengers: n,
                femalePassengers: 0,
              })
            }
          />
          <CountStepper
            label={t("book.select.luggage")}
            value={luggage}
            min={0}
            max={6}
            onChange={(n) => setRequest({ luggageCounts: n })}
          />
          {showGender && (
            <div className="grid grid-cols-2 gap-3">
              <CountStepper
                label="Male passengers"
                value={request.malePassengers ?? seats}
                min={0}
                max={7}
                onChange={(n) =>
                  setRequest({
                    malePassengers: n,
                    seats: n + (request.femalePassengers ?? 0),
                  })
                }
              />
              <CountStepper
                label="Female passengers"
                value={request.femalePassengers ?? 0}
                min={0}
                max={7}
                onChange={(n) =>
                  setRequest({
                    femalePassengers: n,
                    seats: (request.malePassengers ?? 0) + n,
                  })
                }
              />
            </div>
          )}

          <div className="rounded-2xl border border-border bg-muted/10 p-5 flex flex-col gap-2">
            {fareLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Getting fare…
              </div>
            )}
            {fare && (
              <>
                <div className="text-sm font-semibold mb-2">Fare Breakdown</div>
                <FareRow
                  label="Est. distance"
                  value={`${fare.estimatedDistance.toFixed(1)} km`}
                />
                <FareRow
                  label="Est. duration"
                  value={`${fare.estimatedDuration} min`}
                />

                {/* <div className="border-t border-border my-2" /> */}
                {/* {renderFareBreakdownRows(
                  fare.fareBreakdown as unknown as Record<string, unknown>,
                )} */}

                <div className="border-t border-border my-2" />
                <FareRow
                  label="VAT"
                  value={`€${fare?.fareBreakdown?.vat ? fare.fareBreakdown.vat.toFixed(2) : (fare?.fareBreakdown?.vatAmount?.toFixed(2) ?? "0.00")}`}
                />
                <FareRow
                  label={t("book.select.fareEstimated")}
                  value={`€${fare.estimatedFare.toFixed(2)}`}
                  primary
                />
                {request.type !== "private" && (
                  <SplitSharePreview
                    quotedFare={fare.estimatedFare}
                    preview={previewSplitIfJoined(
                      fare.estimatedFare,
                      seats,
                      generals,
                    )}
                    feePercent={splitSurchargePercent(generals)}
                  />
                )}
              </>
            )}

            {!fareLoading && !fare && (
              <p className="text-sm text-muted-foreground">
                Could not estimate fare. Check your route and try again.
              </p>
            )}
          </div>
          <Card className="">
            <CardContent>
              <FareRow label="Large Suitcases" value="75 x 50 = 35cm" />
              <FareRow label="Small Suitcases" value="60 x 40 = 26cm" />
            </CardContent>
          </Card>

          <Button
            className="w-full h-12"
            type="button"
            onClick={handleContinue}
            disabled={fareLoading || !fare}
          >
            {t("book.select.continue")}
          </Button>
        </FieldGroup>
      </div>

      <div className="relative h-56 lg:h-full overflow-hidden">
        <div className="absolute top-4 left-4 right-4 z-10 hidden lg:block rounded-2xl border border-border bg-background/95 p-4 shadow-lg">
          <AddressSummary
            pickup={pickup?.address}
            destination={destination?.address}
          />
        </div>

        <RideMap center={center} zoom={12} className="h-full" theme="light">
          <MapControls showZoom />
          {pickup?.lat ? (
            <MapMarker longitude={pickup.lng} latitude={pickup.lat}>
              <MarkerContent>
                <div className="size-4 rounded-full bg-primary border-2 border-white shadow-md" />
              </MarkerContent>
            </MapMarker>
          ) : null}
          {destination?.lat ? (
            <MapMarker longitude={destination.lng} latitude={destination.lat}>
              <MarkerContent>
                <div className="size-4 rounded-full bg-destructive border-2 border-white shadow-md" />
              </MarkerContent>
            </MapMarker>
          ) : null}
          {pickup && destination ? (
            <RouteLayer pickup={pickup} destination={destination} />
          ) : null}
        </RideMap>
      </div>
    </div>
  );
}
