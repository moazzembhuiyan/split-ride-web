"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  AlertCircleIcon,
  Call02Icon,
  Location01Icon,
  Mail01Icon,
  Navigation03Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useBookingById } from "@/hooks/booking/use-booking";
import { usePassengersByRide } from "@/hooks/booking/use-ride";
import { useT } from "@/i18n";
import { isRefundAllowed, settingsMap } from "@/lib/general-settings";
import {
  partiesFromPassengers,
  settleSplitRide,
  unwrapPassengers,
} from "@/lib/split-settlement";
import { SplitSettlementCard } from "@/components/booking/split-share-card";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useCards } from "@/hooks/booking/use-payment";
import {
  useCancellationQuote,
  useChangeBookingStatus,
} from "@/hooks/booking/use-booking";
import { cancelRide, quoteLines } from "@/lib/cancel-ride";
import {
  formatCardBrand,
  getCardPaymentMethodId,
  getCardRecordId,
} from "@/lib/card";
import { chargeBooking } from "@/lib/pay-booking";
import { savePendingPayment } from "@/lib/pending-payment";
import { departureLabel } from "@/lib/ride-time";
import { refreshRideLists } from "@/lib/refresh-rides";
import { toast } from "sonner";
import { useSocket } from "@/hooks/shared/use-socket";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

function SupportFooter() {
  const t = useT();
  return (
    <p className="text-sm text-muted-foreground text-center">
      {t("book.issueMsg")}{" "}
      <Link
        href="/help"
        className="text-primary font-semibold hover:underline"
      >
        {t("book.support")}
      </Link>
    </p>
  );
}

function StepStatus({
  response,
  acceptedRide,
  pickupAddress,
  destinationAddress,
}: {
  response: {
    _id: string;
    passengerId: {
      pickup: {
        address: string;
        coordinates: Array<number>;
      };
      destination: {
        address: string;
        coordinates: Array<number>;
      };
      _id: string;
      departureDate: string;
      departureTime: string;
      fareType: string;
      initialCharge: number;
      perKmCharge: number;
      totalKmCharge: number;
      luggageCharge: number;
      holidayTripCharge: number;
      vat: number;
      estimatedFare: number;
      estimatedDistanceKm: number;
      luggageCounts: number;
    };
    rideId: {
      _id: string;
      type: string;
      vehicleId: {
        _id: string;
        name: string;
        number: string;
        year: number;
        seats: number;
      };
    };
    userId: {
      _id: string;
      name: string;
      email: string;
      profileImage: string | null;
      phone: string;
    };
    driverId: {
      _id: string;
      name: string;
      email: string;
      profileImage: string;
      phone: string;
    };
    totalFare: number;
    amountPaid: number;
    bookingStatus: string;
    paymentStatus: string;
    id: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  acceptedRide: { rideId: string; driverId: string } | undefined;
  pickupAddress: string;
  destinationAddress: string;
}) {
  const t = useT();
  const { socket } = useSocket();
  const waiting = !acceptedRide;
  const { data: cardsResp } = useCards();
  const cancelBooking = useChangeBookingStatus(response?._id ?? "");
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [paying, setPaying] = useState(false);
  const [chosenCardId, setChosenCardId] = useState("");
  const cards = cardsResp?.data ?? [];
  const chosenCard =
    cards.find((c) => getCardPaymentMethodId(c) === chosenCardId) ??
    cards.find((c) => c.isDefault) ??
    cards[0];
  const isCancelled = /cancel/i.test(response?.bookingStatus ?? "");
  const quote = useCancellationQuote(response?.rideId?._id ?? "", {
    enabled: cancelOpen,
  });
  const { data: settingsData } = useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const rideType = response?.rideId?.type === "private" ? "private" : "split";
  const { data: passengersResp } = usePassengersByRide(
    rideType === "split" ? (response?.rideId?._id ?? "") : "",
    { refetchInterval: rideType === "split" ? 15000 : undefined },
  );
  const settlement =
    rideType === "split"
      ? settleSplitRide(
          partiesFromPassengers(unwrapPassengers(passengersResp?.data)),
          generals,
        )
      : null;
  const refundCheck = isRefundAllowed(
    rideType,
    response?.passengerId?.departureDate ?? "",
    response?.passengerId?.departureTime ?? "",
    generals,
  );
  // The server's quote decides; the local rule is only used without one.
  const canCancel = quote.data ? true : refundCheck.ok || !quote.isError;
  const departure = departureLabel(response?.passengerId);

  async function handleCancel() {
    if (!response?._id || cancelling) return;
    setCancelling(true);
    const result = await cancelRide(socket, {
      bookingId: response._id,
      rideId: acceptedRide?.rideId || response.rideId?._id,
      passengerId: response.passengerId?._id,
      accepted: !!acceptedRide,
      reason: cancelReason,
      quote: quote.data,
      fallback: () =>
        cancelBooking.mutateAsync({
          status: "cancelled",
          cancellationReason: cancelReason || undefined,
        }),
    });
    setCancelling(false);
    if (result.ok) {
      toast.success(result.message);
      setCancelReason("");
      setCancelOpen(false);
      refreshRideLists(queryClient);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 w-full">
      <div className="flex flex-col gap-5 min-w-0">
        <FareRow label="Booking ID" value={response?.id || ""} />
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
                src={response?.driverId?.profileImage || "/user.png"}
                alt="Driver"
              />
            </Avatar>
            <p className="font-bold text-sm mt-1">{response?.driverId?.name}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Mail01Icon} className="size-3.5" />
              <span>{response?.driverId?.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
              <span>{response?.driverId?.phone}</span>
            </div>
          </div>
        )}

        {response && (
          <div className="flex flex-col gap-1.5">
            <p className="font-bold text-sm">Fare Breakdown</p>
            <FareRow
              label="Initial charge"
              value={`€${response.passengerId.initialCharge.toFixed(2)}`}
            />
            <FareRow
              label={`${response.passengerId.estimatedDistanceKm.toFixed(1)} km`}
              value={`€${response.passengerId.totalKmCharge.toFixed(2)}`}
            />
            <FareRow
              label="Luggage"
              value={`€${response.passengerId.luggageCharge.toFixed(2)}`}
            />
            <FareRow
              label="VAT"
              value={`€${response.passengerId.vat.toFixed(2)}`}
            />
            <FareRow
              label="Total fare"
              value={`€${response.passengerId.estimatedFare.toFixed(2)}`}
              primary
            />
            {settlement && (
              <SplitSettlementCard
                settlement={settlement}
                myPassengerId={response.passengerId._id}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {response && (
          <div className="rounded-2xl border border-border bg-muted/10 p-5 flex flex-col gap-2.5">
            <p className="font-bold text-sm">{t("book.select.rideDetails")}</p>

            <FareRow label="Ride type" value={response.rideId?.type ?? "—"} />
            <FareRow
              label="Vehicle"
              value={
                response.rideId?.vehicleId
                  ? `${response.rideId.vehicleId.name} (${response.rideId.vehicleId.number})`
                  : "—"
              }
            />
            <FareRow
              label="Booking Date"
              value={departure.date}
            />
            <FareRow
              label="Booking Seats"
              value={`(${response.rideId?.vehicleId?.seats} seater)`}
            />
            <FareRow
              label="Pickup time"
              value={departure.time}
            />
            {/* <FareRow label="Status" value={response.bookingStatus} /> */}
            <FareRow label="Payment" value={response.paymentStatus} />
          </div>
        )}
        <div className="w-full flex flex-col gap-2">
          {response?.paymentStatus === "pending" && (
            <>
            <Alert variant="destructive">
              <HugeiconsIcon icon={AlertCircleIcon} />
              <AlertDescription className="text-xs">
                {t("book.select.bookingNotConfirmed")}
              </AlertDescription>
            </Alert>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="lg" disabled={paying}>
                  {paying
                    ? t("book.select.processingPayment")
                    : `${t("book.select.payNow")} — €${(response?.totalFare ?? 0).toFixed(2)}`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="gap-1">
                <AlertDialogHeader>Confirm Payment</AlertDialogHeader>
                <AlertDialogDescription>
                  {cards.length > 0
                    ? t("book.select.payWithCard")
                    : t("book.select.noSavedCard")}
                </AlertDialogDescription>
                <div className="mt-2 flex flex-col gap-2">
                  {cards.map((card) => {
                    const selected = card === chosenCard;
                    return (
                      <button
                        key={getCardRecordId(card)}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setChosenCardId(getCardPaymentMethodId(card))
                        }
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-start ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        }`}
                      >
                        <span className="font-medium" dir="ltr">
                          {formatCardBrand(card.brand)} •••• {card.last4 ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      if (!response?._id) return;
                      const paymentMethodId = chosenCard
                        ? getCardPaymentMethodId(chosenCard)
                        : "";
                      if (!paymentMethodId) {
                        toast.error(t("book.select.noSavedCard"));
                        return;
                      }
                      setPaying(true);
                      try {
                        savePendingPayment({
                          rideId: response.rideId._id,
                          passengerId: response.passengerId._id,
                          bookingId: response._id,
                        });
                        await chargeBooking({
                          booking: response._id,
                          paymentMethodId,
                        });
                        toast.success(t("book.select.paymentSuccessful"));
                        window.location.reload();
                      } catch (err) {
                        toast.error(
                          err instanceof Error
                            ? err.message
                            : t("book.select.paymentFailed"),
                        );
                      } finally {
                        setPaying(false);
                      }
                    }}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </>
          )}
          {!isCancelled && (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/single-car.webp"
                alt="Payment"
                width={500 / 5}
                height={200 / 5}
                className="-scale-x-90 w-12"
              />
              <p className="text-sm font-semibold">Cancel your ride?</p>
            </div>
            <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant={"destructive"}>
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="gap-1">
                <div className="p-6">
                  <div className="size-24 bg-destructive rounded-full mx-auto text-background flex justify-center items-center">
                    <HugeiconsIcon icon={HelpCircleIcon} className="size-18" />
                  </div>
                </div>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-center w-full">
                    Cancel Ride?
                  </AlertDialogTitle>
                  <p className="text-center w-full mb-2">
                    Booking ID:{" "}
                    <span className="text-primary">{response?.id}</span>
                  </p>
                </AlertDialogHeader>
                <AlertDialogDescription className="text-center">
                  {quote.isPending
                    ? t("cancel.loadingQuote")
                    : quote.data
                      ? quoteLines(quote.data).map((line) => (
                          <span key={line} className="block">
                            {line}
                          </span>
                        ))
                      : refundCheck.ok
                        ? t("cancel.quoteUnavailable")
                        : refundCheck.message}
                </AlertDialogDescription>
                <Textarea
                  placeholder="Reason for cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-2"
                />
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel disabled={cancelling}>
                    {t("common.back")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="border-destructive/20! border-2!"
                    variant="destructive"
                    disabled={cancelling || quote.isPending || !canCancel}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleCancel();
                    }}
                  >
                    {cancelling ? "Cancelling…" : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          )}
        </div>
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
  const params = useParams();
  const bookingId = params?.id as string;
  const { data: bookingResp, isLoading } = useBookingById(bookingId);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-lg font-semibold text-primary animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  const b = bookingResp?.data;
  const p = b?.passengerId ?? null;

  return (
    <div className="flex flex-col px-4 sm:px-10 py-10 items-center gap-6 overflow-y-auto h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold text-start w-full max-w-205">
        {t("book.title")}
      </h1>
      <div className="w-full max-w-205">
        <StepStatus
          response={b ?? null}
          acceptedRide={
            b?.driverId?._id
              ? {
                  rideId: b.rideId?._id ?? "",
                  driverId: b.driverId._id,
                }
              : undefined
          }
          pickupAddress={p?.pickup.address ?? ""}
          destinationAddress={p?.destination.address ?? ""}
        />
      </div>
    </div>
  );
}
