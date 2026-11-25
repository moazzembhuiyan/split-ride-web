"use client";
import {
  Call02Icon,
  InformationCircleIcon,
  Location01Icon,
  Mail01Icon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  Map as RideMap,
  useMap,
} from "@/components/ui/map";
import { useCards } from "@/hooks/booking/use-payment";
import { useSocket } from "@/hooks/shared/use-socket";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { useUserById } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { CYPRUS_CENTER } from "@/lib/cyprus";
import { chargeBooking } from "@/lib/pay-booking";
import {
  formatCardBrand,
  getCardPaymentMethodId,
  getCardRecordId,
} from "@/lib/card";
import { getDrivingRoute } from "@/lib/driving-route";
import {
  isPickupInBookingWindow,
  settingsMap,
} from "@/lib/general-settings";
import { loadPendingPayment, savePendingPayment } from "@/lib/pending-payment";
import { farePayloadFromRequest, quoteRideFare } from "@/lib/request-fare";
import {
  emitRideSubmit,
  toServerRidePayload,
  withTimeout,
} from "@/lib/ride-socket";
import {
  partiesFromPassengers,
  previewJoiningExisting,
  previewSplitIfJoined,
  unwrapPassengers,
  splitSurchargePercent,
} from "@/lib/split-settlement";
import {
  SplitSettlementCard,
  SplitSharePreview,
} from "@/components/booking/split-share-card";
import { rideService } from "@/services/ride.service";
import { usePassengersByRide } from "@/hooks/booking/use-ride";
import { useBookingStore } from "@/store/booking-store";
import { useSocketEvent } from "@/store/socket-store";
import type { Card } from "@/types/payment.types";
import type {
  FareBreakdownResponse,
  RideRequestResponse,
} from "@/types/ride.types";
import { Card as CardComp, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "preview" | "payment" | "status";

let selectReviewInFlight = false;

/** Longest time Send Request may keep loading. */
const SEND_TIMEOUT_MS = 20000;

// ─── Static data ──────────────────────────────────────────────────────────────

const DEFAULT_CENTER: [number, number] = CYPRUS_CENTER;

// ─── RouteLayer ───────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function RouteRow({
  pickup,
  destination,
}: {
  pickup: string;
  destination: string;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={Navigation03Icon} className="size-5 shrink-0" />
        <span className="text-sm font-medium">
          {pickup || "Pickup location"}
        </span>
      </div>
      <div className="ml-2.25 border-l-2 border-dashed border-muted-foreground/40 h-5" />
      <div className="flex items-center gap-3">
        <HugeiconsIcon icon={Location01Icon} className="size-5 shrink-0" />
        <span className="text-sm font-medium">
          {destination || "Destination"}
        </span>
      </div>
    </div>
  );
}

function InfoBanner({
  children,
  variant = "info",
}: {
  children: React.ReactNode;
  variant?: "info" | "error";
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${variant === "error"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/8 text-primary"
        }`}
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        className="size-4 shrink-0 mt-0.5"
      />
      <span>{children}</span>
    </div>
  );
}

function GradientButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-12 rounded-4xl bg-linear-to-r from-cyan-400 via-violet-500 to-pink-400 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

function SupportFooter() {
  const t = useT();
  return (
    <p className="text-sm text-muted-foreground text-center">
      {t("book.issueMsg")}{" "}
      <Link href="/help" className="text-primary font-semibold hover:underline">
        {t("book.support")}
      </Link>
    </p>
  );
}

// ─── Step views ───────────────────────────────────────────────────────────────

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

function StepPreview({
  male,
  female,
  luggage,
  note,
  setNote,
  scheduledDate,
  scheduledTime,
  pickupAddress,
  destinationAddress,
  fareResponse,
  agreed,
  setAgreed,
  onBook,
  sending,
  loading,
  isSplit,
  feePercent,
  sharePreview,
  joinSettlement,
  joining,
}: {
  male: number;
  female: number;
  luggage: number;
  note: string;
  setNote: (v: string) => void;
  scheduledDate: string;
  scheduledTime: string;
  pickupAddress: string;
  destinationAddress: string;
  fareResponse: FareBreakdownResponse | null;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onBook: () => void;
  sending: boolean;
  loading: boolean;
  isSplit: boolean;
  feePercent: number;
  sharePreview: ReturnType<typeof previewSplitIfJoined> | null;
  joinSettlement: ReturnType<typeof previewJoiningExisting> | null;
  joining: boolean;
}) {
  const t = useT();
  const seats = male + female;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 w-full">
      <div className="rounded-2xl border border-border bg-muted/10 p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <RouteRow pickup={pickupAddress} destination={destinationAddress} />
          <Link
            href="/book"
            className="text-sm font-semibold text-primary shrink-0 hover:underline"
          >
            Edit
          </Link>
        </div>
        <div className="border-t border-border" />
        <div className="flex flex-col gap-2">
          <FareRow label={t("book.select.passengers")} value={`${seats}`} />
          <FareRow label={t("book.select.luggage")} value={String(luggage)} />
          <FareRow label="Booking Date" value={scheduledDate} />
          <FareRow label="Pickup Time" value={scheduledTime} />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note for driver (optional)"
          rows={3}
          // biome-ignore lint/a11y/noAutofocus: <explanation>
          autoFocus={false}
          inputMode="text"
          className="w-full resize-none rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
        />
        {loading && <InfoBanner>Getting fare…</InfoBanner>}
        {fareResponse && (
          <>
            <div className="border-t border-border" />
            <div className="flex flex-col gap-2">
              <FareRow
                label="Est. distance"
                value={`${fareResponse.estimatedDistance.toFixed(1)} km`}
              />
              <FareRow
                label="Est. duration"
                value={`${fareResponse.estimatedDuration} min`}
              />
              {/* <div className="border-t border-border my-1" /> */}
              {/* {renderFareBreakdownRows(
                fareResponse.fareBreakdown as unknown as Record<
                  string,
                  unknown
                >,
              )} */}
              <div className="border-t border-border my-1" />
              <FareRow
                label="VAT"
                value={`€${fareResponse?.fareBreakdown?.vat.toFixed(2)}`}
              />
              <FareRow
                label="Total fare"
                value={`€${fareResponse.estimatedFare.toFixed(2)}`}
                primary
              />
            </div>
            {isSplit && joining && joinSettlement?.matched && (
              <SplitSettlementCard
                settlement={joinSettlement}
                myPassengerId="me"
              />
            )}
            {isSplit &&
              sharePreview &&
              !(joining && joinSettlement?.matched) && (
                <SplitSharePreview
                  quotedFare={fareResponse.estimatedFare}
                  preview={sharePreview}
                  feePercent={feePercent}
                />
              )}
          </>
        )}
        {isSplit && <InfoBanner>{t("book.select.finalAdjusts")}</InfoBanner>}
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-muted/10 p-5">
          <p className="font-bold text-sm mb-3">{t("book.select.rideRules")}</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {isSplit && (
              <li className="flex gap-2">
                <span>·</span>
                <span>{t("book.select.ruleOthers")}</span>
              </li>
            )}
            <li className="flex gap-2">
              <span>·</span>
              <span>{t("book.select.rulePickupVary")}</span>
            </li>
            <li className="flex gap-2">
              <span>·</span>
              <span>{t("book.select.ruleCancel")}</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-5 flex flex-col gap-3">
          {isSplit && (
            <>
              <p className="font-bold text-sm">{t("book.select.disclaimer")}</p>
              <p className="text-sm text-muted-foreground">
                {t("book.select.disclaimerText")}
              </p>
            </>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms-agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(!!v)}
            />
            <label
              htmlFor="terms-agree"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary font-semibold underline"
              >
                Terms and Conditions
              </Link>
            </label>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 flex flex-col gap-3">
        <GradientButton
          onClick={onBook}
          disabled={!agreed || sending || loading || !fareResponse}
        >
          {loading
            ? "Getting fare…"
            : sending
              ? t("common.submitting")
              : t("book.select.sendRequest")}
        </GradientButton>
        <SupportFooter />
      </div>
    </div>
  );
}

function cardLabel(card: Card) {
  const brand = formatCardBrand(card.brand);
  const methodId = getCardPaymentMethodId(card);
  const last4 = card.last4 ? `•••• ${card.last4}` : methodId.slice(-4);
  return `${brand} ${last4}`;
}

function StepPayment({
  amount,
  cards,
  selectedMethodId,
  setSelectedMethodId,
  paying,
  error,
  awaitingAccept,
  onPay,
  onBack,
}: {
  amount: number;
  cards: Card[];
  selectedMethodId: string;
  setSelectedMethodId: (id: string) => void;
  paying: boolean;
  error: string | null;
  awaitingAccept: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-5 w-full max-w-xl mx-auto">
      <div className="rounded-2xl border border-border bg-muted/10 p-6 flex flex-col gap-4">
        <p className="font-bold text-sm">{t("book.select.paymentRequired")}</p>
        <FareRow
          label={t("book.select.payAmount")}
          value={`€${amount.toFixed(2)}`}
          primary
        />
        <InfoBanner>{t("book.select.completePaymentToConfirm")}</InfoBanner>

        {cards.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {t("book.select.payWithCard")}
            </p>
            {cards.map((card) => {
              const methodId = getCardPaymentMethodId(card);
              const selected = selectedMethodId === methodId;
              return (
                <button
                  key={getCardRecordId(card)}
                  type="button"
                  onClick={() => setSelectedMethodId(methodId)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-left ${selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background"
                    }`}
                >
                  <span className="font-medium">
                    {cardLabel(card)}
                  </span>
                  {card.isDefault && (
                    <span className="text-xs text-muted-foreground">
                      Default
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("book.select.noSavedCard")}
          </p>
        )}

        {awaitingAccept && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="size-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Preparing your booking for payment…
            </p>
          </div>
        )}

        {error && <InfoBanner variant="error">{error}</InfoBanner>}
      </div>

      <GradientButton
        onClick={onPay}
        disabled={paying || awaitingAccept || !selectedMethodId}
      >
        {paying ? t("book.select.processingPayment") : t("book.select.payNow")}
      </GradientButton>
      <button
        type="button"
        onClick={onBack}
        disabled={paying}
        className="text-sm text-muted-foreground hover:underline"
      >
        {t("book.select.backToReview")}
      </button>
      <SupportFooter />
    </div>
  );
}

function StepStatus({
  response,
  acceptedRide,
  pickupAddress,
  destinationAddress,
}: {
  response: ReturnType<typeof useBookingStore.getState>["response"];
  acceptedRide: { rideId: string; driverId: string } | undefined;
  pickupAddress: string;
  destinationAddress: string;
}) {
  const t = useT();
  const waiting = !acceptedRide;
  const { data: driverRes } = useUserById(acceptedRide?.driverId ?? "", {
    enabled: !!acceptedRide?.driverId,
  });
  const driver = driverRes?.data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 w-full">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex items-center justify-between rounded-2xl bg-linear-to-r from-violet-500 to-primary px-5 py-3">
          <span className="text-white font-semibold text-sm">
            {t("book.select.status")}
          </span>
          <span className="text-white font-semibold text-sm">
            {waiting ? "Searching for driver…" : t("book.select.acceptRequest")}
          </span>
        </div>

        <RouteRow pickup={pickupAddress} destination={destinationAddress} />

        {waiting ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground text-center">
              Notifying nearby drivers. Please wait…
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/30 border border-border p-5 flex flex-col items-center gap-1.5 text-center">
            <Avatar className="size-14 ring-2 ring-primary/20">
              <AvatarImage
                src={driver?.profileImage || "/user.png"}
                alt={driver?.name || "Driver"}
              />
            </Avatar>
            <p className="font-bold text-sm mt-1">
              {driver?.name || "Driver found!"}
            </p>
            {driver?.email && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
                <span>{driver.email}</span>
              </div>
            )}
            {driver?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
                <span>{driver.phone}</span>
              </div>
            )}
          </div>
        )}

        {response && (
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-sm">Fare Estimate</p>
            <FareRow
              label="Est. distance"
              value={`${response.estimatedDistance.toFixed(1)} km`}
            />
            <FareRow
              label="Est. duration"
              value={`${response.estimatedDuration} min`}
            />
            {/* <div className="border-t border-border my-1" />
            {renderFareBreakdownRows(
              response.fareBreakdown as unknown as Record<string, unknown>,
            )} */}
            {response?.fareBreakdown && (
              <>
                <FareRow
                  label="VAT"
                  value={`€${response?.fareBreakdown?.vat.toFixed(2)}`}
                />
                <div className="border-t border-border my-1" />
                <FareRow
                  label="Total fare"
                  value={`€${response?.estimatedFare?.toFixed(2) ?? 0}`}
                  primary
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* <pre className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-amber-400 rounded-xl p-6 shadow-lg overflow-x-auto text-sm leading-relaxed border border-zinc-700">
        <code className="whitespace-pre-wrap">
          {JSON.stringify(response, null, 2)}
        </code>
      </pre> */}

      <div className="flex flex-col gap-4">
        {response && response?.rideDetails && (
          <div className="rounded-2xl border border-border bg-muted/10 p-5 flex flex-col gap-2.5">
            <p className="font-bold text-sm">{t("book.select.rideDetails")}</p>
            <FareRow
              label="Ride type"
              value={response?.rideDetails?.rideType}
            />
            <FareRow
              label="Booking Date"
              value={response?.rideDetails?.bookingDate}
            />
            <FareRow
              label="Pickup time"
              value={response.rideDetails.bookingTime}
            />
            <FareRow
              label="Drivers notified"
              value={String(response.notifiedDrivers)}
            />
          </div>
        )}

        <InfoBanner>{t("book.select.paymentConfirmedSearching")}</InfoBanner>
      </div>

      <div className="lg:col-span-2">
        <SupportFooter />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const t = useT();
  const router = useRouter();
  const { socket } = useSocket();
  const { data: cardsResp } = useCards();
  const cards = cardsResp?.data ?? [];
  const request = useBookingStore((s) => s.request);
  const response = useBookingStore((s) => s.response);
  const setResponse = useBookingStore((s) => s.setResponse);
  const bookingId = useBookingStore((s) => s.bookingId);
  const setBookingId = useBookingStore((s) => s.setBookingId);
  const passengerId = useBookingStore((s) => s.passengerId);
  const setPassengerId = useBookingStore((s) => s.setPassengerId);
  const paid = useBookingStore((s) => s.paid);
  const setPaid = useBookingStore((s) => s.setPaid);
  const joinRideId = useBookingStore((s) => s.joinRideId);
  const intent = useBookingStore((s) => s.intent);

  const { data: settingsData, isFetched: settingsFetched } =
    useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const { data: joinPassengersResp } = usePassengersByRide(joinRideId ?? "");
  const joinParties = partiesFromPassengers(
    unwrapPassengers(joinPassengersResp?.data),
  );

  const setRequest = useBookingStore((s) => s.setRequest);
  const hasHydrated = useBookingStore((s) => s.hasHydrated);
  const [step, setStep] = React.useState<Step>("preview");
  const male = request.seats ?? request.malePassengers ?? 1;
  const female = request.femalePassengers ?? 0;
  const luggage = request.luggageCounts ?? 0;
  const [note, setNote] = React.useState(request.note ?? "");
  const [agreed, setAgreed] = React.useState(false);
  const [fareResponse, setFareResponse] =
    useState<FareBreakdownResponse | null>(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [awaitingAccept, setAwaitingAccept] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const chargingRef = React.useRef(false);
  const sendingRef = React.useRef(false);
  const reviewLoadedRef = React.useRef(false);

  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  }, []);

  const acceptedEvent = useSocketEvent("ride:driver-accepted");
  const [acceptedRide, setAcceptedRide] = useState<
    { rideId: string; driverId: string } | undefined
  >();

  useEffect(() => {
    const pending = loadPendingPayment();
    if (!pending) return;
    if (pending.response) setResponse(pending.response);
    if (pending.bookingId) setBookingId(pending.bookingId);
    if (pending.passengerId) setPassengerId(pending.passengerId);
    if (pending.paid) {
      setPaid(true);
      setStep("status");
    } else if (pending.bookingId || pending.rideId) {
      setStep("payment");
    }
  }, [setBookingId, setPaid, setPassengerId, setResponse]);

  useEffect(() => {
    if (!selectedMethodId && cards.length > 0) {
      const def = cards.find((c) => c.isDefault) ?? cards[0];
      setSelectedMethodId(getCardPaymentMethodId(def));
    }
  }, [cards, selectedMethodId]);

  useEffect(() => {
    if (acceptedEvent) setAcceptedRide(acceptedEvent.data);
  }, [acceptedEvent]);

  const pickupAddress = request.pickup?.address ?? "";
  const destinationAddress = request.destination?.address ?? "";

  const isWideLayout =
    step === "preview" || step === "payment" || step === "status";

  async function resolveBookingId(pid: string): Promise<string | undefined> {
    const passenger = await rideService.getRideRequestById(pid);
    const id = passenger.data?.bookingId?.trim();
    return id || undefined;
  }

  async function emitRideRequest(): Promise<RideRequestResponse> {
    const payload = toServerRidePayload(request, {
      seats: request.passengers ?? request.seats ?? male + female,
      note,
    });
    if (!payload) {
      throw new Error("Missing ride details. Go back and fill the form.");
    }
    const mode =
      intent === "find" || joinRideId
        ? "find"
        : intent === "private"
          ? "private"
          : "start";
    return emitRideSubmit(socket, mode, { ...payload, vehicleType: payload.passengers > 4 ? 6 : 4 });
  }

  async function submitBooking(): Promise<{
    rideRes: RideRequestResponse;
    pid: string;
    bid?: string;
  }> {
    // Read from the store: a run that timed out may have finished since.
    const known = useBookingStore.getState();
    let rideRes = known.response;
    let pid = known.passengerId || rideRes?.passengerId || undefined;
    let bid = known.bookingId ?? undefined;
    if (rideRes?.rideId && !pid) {
      try {
        const passengers = await rideService.getPassengersByRideId(
          rideRes.rideId,
        );
        const list = Array.isArray(passengers.data) ? passengers.data : [];
        pid = list[0]?._id;
        if (pid) setPassengerId(pid);
      } catch {
        // fall through to ride:request
      }
    }

    const alreadySubmitted = Boolean(bid || rideRes?.bookingId);
    if ((!rideRes?.rideId || !pid) && !alreadySubmitted) {
      rideRes = await emitRideRequest();
      setResponse(rideRes);
      pid = rideRes.passengerId;
      setPassengerId(pid);
      const socketBookingId = rideRes.bookingId;
      if (socketBookingId) {
        bid = socketBookingId;
        setBookingId(bid);
      }
    }

    if (!bid && pid) {
      bid = await resolveBookingId(pid);
      if (bid) setBookingId(bid);
    }

    if (!bid && pid && rideRes) {
      savePendingPayment({
        rideId: rideRes.rideId,
        passengerId: pid,
        response: rideRes,
      });
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        bid = await resolveBookingId(pid);
        if (bid) {
          setBookingId(bid);
          break;
        }
      }
    }

    if (!rideRes || (!pid && !bid)) {
      throw new Error("Failed to submit booking");
    }
    pid = pid || rideRes.passengerId || "";

    savePendingPayment({
      rideId: rideRes.rideId,
      passengerId: pid,
      bookingId: bid,
      response: rideRes,
    });

    return { rideRes, pid, bid };
  }

  async function chargeResolvedBooking(
    bid: string,
    rideRes: RideRequestResponse,
    pid: string,
  ) {
    savePendingPayment({
      rideId: rideRes.rideId,
      passengerId: pid,
      bookingId: bid,
      response: rideRes,
    });
    const result = await chargeBooking({
      booking: bid,
      paymentMethodId: selectedMethodId,
    });
    setPaid(true);
    savePendingPayment({
      rideId: rideRes.rideId,
      passengerId: pid,
      bookingId: bid,
      paid: true,
      response: {
        ...rideRes,
        notifiedDrivers: result.notifiedDrivers ?? rideRes.notifiedDrivers,
      },
    });
    if (result.notifiedDrivers != null) {
      setResponse({ ...rideRes, notifiedDrivers: result.notifiedDrivers });
    }
    setStep("status");
  }

  async function failPayment(message: string) {
    setPayError(message);
    toast.error(message);
  }

  async function handlePay() {
    if (
      !request.pickup ||
      !request.destination ||
      !request.departureDate ||
      !request.departureTime
    ) {
      toast.error("Missing ride details. Go back and fill the form.");
      return;
    }
    if (!selectedMethodId) {
      toast.error(t("book.select.noSavedCard"));
      return;
    }
    if (request.departureDate && request.departureTime) {
      const type = request.type === "private" ? "private" : "split";
      const windowCheck = isPickupInBookingWindow(
        type,
        request.departureDate,
        request.departureTime,
        generals,
      );
      if (!windowCheck.ok) {
        toast.error(windowCheck.message);
        return;
      }
    }
    if (chargingRef.current) return;
    chargingRef.current = true;
    setPaying(true);
    setPayError(null);

    let bid = bookingId ?? undefined;
    let paidOk = false;

    try {
      const submitted = await submitBooking();
      bid = submitted.bid;
      if (!bid) {
        throw new Error(
          "Booking is not ready for payment yet. Please try again.",
        );
      }
      await chargeResolvedBooking(bid, submitted.rideRes, submitted.pid);
      paidOk = true;
      localStorage.setItem(
        "waitingBooking",
        JSON.stringify({ bookingId: bid, paidTime: Date.now() }),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("book.select.paymentFailed");
      if (!paidOk) await failPayment(message);
    } finally {
      chargingRef.current = false;
      setPaying(false);
      setAwaitingAccept(false);
    }
  }

  async function handleNext(): Promise<boolean> {
    if (
      !request.pickup ||
      !request.destination ||
      !request.departureDate ||
      !request.departureTime
    ) {
      toast.error("Missing ride details. Go back and fill the form.");
      return false;
    }

    const pickup = request.pickup;
    const destination = request.destination;
    const latest = useBookingStore.getState().request;
    if (selectReviewInFlight) return false;
    selectReviewInFlight = true;

    setFareLoading(true);
    try {
      const payload = farePayloadFromRequest({
        ...request,
        ...latest,
        pickup,
        destination,
      });
      if (!payload) {
        toast.error("Missing ride details. Go back and fill the form.");
        return false;
      }
      const quoted = await quoteRideFare({
        socket,
        payload,
        settings: generals,
      });

      setFareResponse(quoted);
      setStep("preview");
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to get fare estimate",
      );
      return false;
    } finally {
      selectReviewInFlight = false;
      setFareLoading(false);
    }
  }

  const handleNextRef = React.useRef(handleNext);
  handleNextRef.current = handleNext;

  useEffect(() => {
    if (!hasHydrated) return;
    if (loadPendingPayment()?.paid) return;
    if (
      !request.pickup ||
      !request.destination ||
      !request.departureDate ||
      !request.departureTime
    ) {
      router.replace("/book");
      return;
    }
    if (!settingsFetched || reviewLoadedRef.current) return;
    reviewLoadedRef.current = true;
    void handleNextRef.current();
  }, [
    hasHydrated,
    settingsFetched,
    router,
    request.pickup,
    request.destination,
    request.departureDate,
    request.departureTime,
  ]);

  async function handleSendRequest() {
    // The ref also stops a double click within one render.
    if (!agreed || sendingRef.current) return;
    const type = request.type === "private" ? "private" : "split";
    if (request.departureDate && request.departureTime) {
      const windowCheck = isPickupInBookingWindow(
        type,
        request.departureDate,
        request.departureTime,
        generals,
      );
      if (!windowCheck.ok) {
        toast.error(windowCheck.message);
        return;
      }
    }
    sendingRef.current = true;
    setSending(true);
    setPayError(null);
    try {
      await withTimeout(submitBooking(), SEND_TIMEOUT_MS);
      setStep("payment");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send ride request",
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <div
      className={`${isWideLayout ? "flex flex-col" : "grid grid-cols-2"} h-[calc(100vh-64px)]`}
    >
      <div
        className={`flex flex-col overflow-y-auto gap-6 ${isWideLayout ? "px-4 sm:px-10 py-10 items-center" : "px-4 sm:px-10 py-10"
          }`}
      >
        <h1
          className={`text-2xl sm:text-4xl font-bold ${isWideLayout ? "text-center" : ""}`}
        >
          {t("book.title")}
        </h1>

        <div className={isWideLayout ? "w-full max-w-205" : "w-full"}>
          {step === "preview" && (
            <StepPreview
              male={male}
              female={female}
              luggage={luggage}
              note={note}
              setNote={(value) => {
                setNote(value);
                setRequest({ note: value });
              }}
              scheduledDate={request.departureDate ?? ""}
              scheduledTime={request.departureTime ?? ""}
              pickupAddress={pickupAddress}
              destinationAddress={destinationAddress}
              fareResponse={fareResponse}
              agreed={agreed}
              setAgreed={setAgreed}
              onBook={() => void handleSendRequest()}
              sending={sending}
              loading={fareLoading}
              isSplit={request.type !== "private"}
              feePercent={splitSurchargePercent(generals)}
              sharePreview={
                fareResponse && request.type !== "private"
                  ? previewSplitIfJoined(
                    fareResponse.estimatedFare,
                    male + female,
                    generals,
                  )
                  : null
              }
              joinSettlement={
                fareResponse && joinRideId
                  ? previewJoiningExisting(
                    joinParties,
                    fareResponse.estimatedFare,
                    male + female,
                    generals,
                  )
                  : null
              }
              joining={Boolean(joinRideId)}
            />
          )}
          {step === "payment" && (
            <StepPayment
              amount={
                fareResponse?.estimatedFare ?? response?.estimatedFare ?? 0
              }
              cards={cards}
              selectedMethodId={selectedMethodId}
              setSelectedMethodId={setSelectedMethodId}
              paying={paying}
              error={payError}
              awaitingAccept={awaitingAccept}
              onPay={handlePay}
              onBack={() => setStep("preview")}
            />
          )}
          {step === "status" && (
            <StepStatus
              response={response}
              acceptedRide={acceptedRide}
              pickupAddress={pickupAddress}
              destinationAddress={destinationAddress}
            />
          )}
        </div>
      </div>

      {!isWideLayout && (
        <div className="h-full">
          <RideMap
            center={
              request.pickup?.lng && request.destination?.lng
                ? [
                  (request.pickup.lng + request.destination.lng) / 2,
                  (request.pickup.lat + request.destination.lat) / 2,
                ]
                : DEFAULT_CENTER
            }
            zoom={13}
            className="h-full"
            theme="light"
          >
            <MapControls />
            {request.pickup?.lat && request.pickup.lat !== 0 && (
              <MapMarker
                longitude={request.pickup.lng}
                latitude={request.pickup.lat}
              >
                <MarkerContent>
                  <div className="size-4 rounded-full bg-primary border-2 border-white shadow-md" />
                </MarkerContent>
              </MapMarker>
            )}
            {request.destination?.lat && request.destination.lat !== 0 && (
              <MapMarker
                longitude={request.destination.lng}
                latitude={request.destination.lat}
              >
                <MarkerContent>
                  <div className="size-4 rounded-full bg-destructive border-2 border-white shadow-md" />
                </MarkerContent>
              </MapMarker>
            )}
            {request.pickup && request.destination && (
              <RouteLayer
                pickup={request.pickup}
                destination={request.destination}
              />
            )}
          </RideMap>
        </div>
      )}
    </div>
  );
}
