"use client";
import { Location01Icon, Navigation03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useRideById } from "@/hooks/booking/use-booking";
import { useGeneralSettings } from "@/hooks/shared/use-settings";
import { useT } from "@/i18n";
import { bookingNumber, isOverdueRide, rideDateLabel } from "@/lib/admin-ride";
import { statusText } from "@/lib/admin-status";
import { settingsMap } from "@/lib/general-settings";
import {
  partiesFromPassengers,
  settleSplitRide,
} from "@/lib/split-settlement";
import { SplitSettlementCard } from "@/components/booking/split-share-card";
import { cn } from "@/lib/utils";
import type { AdminBooking, RidePassenger } from "@/types/booking.types";
import { DeleteRideButton } from "../bookings/page";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fmt(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PassengerCard({ p }: { p: RidePassenger }) {
  const t = useT();
  const rows = [
    { label: t("admin.bookings.pickup"), value: p.pickup.address },
    { label: t("admin.bookings.dropOff"), value: p.destination.address },
    { label: t("admin.bookings.seats"), value: String(p.requestedSeats) },
    { label: t("admin.bookings.luggage"), value: String(p.luggageCounts) },
    { label: t("admin.bookings.distance"), value: `${p.estimatedDistanceKm} km` },
    { label: t("admin.bookings.duration"), value: `${p.estimatedDurationMinutes} min` },
    { label: t("admin.bookings.departed"), value: p.departureTime },
    { label: t("admin.bookings.arrivedAt"), value: fmt(p.arriveAt) },
    { label: t("admin.bookings.pickedUp"), value: fmt(p.pickedUpAt) },
    { label: t("admin.bookings.droppedOff"), value: fmt(p.droppedOffAt) },
    { label: t("admin.bookings.initialCharge"), value: `€${p.initialCharge.toFixed(2)}` },
    { label: t("admin.bookings.kmCharge"), value: `€${p.totalKmCharge.toFixed(2)}` },
    { label: t("admin.bookings.luggageCharge"), value: `€${p.luggageCharge.toFixed(2)}` },
    { label: t("admin.bookings.vat"), value: `€${p.vat.toFixed(2)}` },
    { label: t("admin.bookings.waiting"), value: `€${p.waitingCharge.toFixed(2)}` },
    { label: t("admin.bookings.paid"), value: `€${(p.paidAmount ?? 0).toFixed(2)}` },
    {
      label: t("admin.bookings.matchingFee"),
      value: `€${(p.surchargeAmount ?? 0).toFixed(2)}`,
    },
    {
      label: t("admin.bookings.refund"),
      value: `€${(p.refundAmount ?? 0).toFixed(2)}`,
    },
    {
      label: t("admin.bookings.totalFare"),
      value: `€${p.totalFare.toFixed(2)}`,
      bold: true,
    },
    {
      label: t("admin.bookings.payment"),
      value: statusText(t, p.paymentStatus),
    },
  ];

  return (
    <div className="bg-muted rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage
            src={p.userId.profileImage ?? undefined}
            alt={p.userId.name}
          />
          <AvatarFallback>{initials(p.userId.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold">{p.userId.name}</p>
          <p className="text-xs text-muted-foreground">{p.userId.phone}</p>
        </div>
        <Badge
          className={cn(
            "ml-auto text-xs",
            p.paymentStatus === "paid"
              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
              : "bg-orange-100 text-orange-700 border-orange-200",
          )}
        >
          {statusText(t, p.paymentStatus)}
        </Badge>
      </div>
      {p.note && (
        <p className="text-xs text-muted-foreground italic">"{p.note}"</p>
      )}
      <Table>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className="border-none">
              <TableCell className="text-xs text-muted-foreground py-1 pl-0">
                {row.label}
              </TableCell>
              <TableCell
                className={cn(
                  "text-xs py-1 pr-0 text-right",
                  row.bold
                    ? "font-bold text-foreground"
                    : "font-medium text-primary",
                )}
              >
                {row.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RideDialog({ item }: { item: AdminBooking }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { data, isPending } = useRideById(open ? item._id : null);
  const ride = data?.data;
  const { data: settingsData } = useGeneralSettings();
  const generals = settingsMap(settingsData?.data);
  const settlement =
    ride && (ride.type === "split" || ride.passengers.length > 1)
      ? settleSplitRide(partiesFromPassengers(ride.passengers), generals)
      : null;

  const reference = bookingNumber(item) ?? bookingNumber(ride);
  const shownId = reference ?? item.rideShortId ?? item.id;
  const referenceLabel = reference
    ? t("admin.bookings.colBookingId")
    : t("admin.bookings.rideId");

  const invoiceData = [
    { label: referenceLabel, value: shownId },
    { label: t("admin.bookings.colDateTime"), value: rideDateLabel(item) },
    {
      label: t("admin.bookings.colDriver"),
      value: item.driverId?.name ?? "—",
    },
    {
      label: t("admin.bookings.colSeats"),
      value: String(item.bookedSeats ?? "—"),
    },
    {
      label: t("admin.bookings.rideStatus"),
      value: statusText(t, item.status),
      highlight: true,
    },
    ...(item.paymentStatus
      ? [
          {
            label: t("admin.bookings.colPaymentStatus"),
            value: statusText(t, item.paymentStatus),
            highlight: true,
          },
        ]
      : []),
  ];

  const statusColor =
    item.status === "completed"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : item.status === "scheduled"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-muted text-muted-foreground";

  const overdue = isOverdueRide(item);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="bg-muted cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row justify-start items-start gap-4">
            {/* <div className="flex items-center gap-4 w-46">
              <Image
                src="https://placehold.co/64.png"
                alt="Ride"
                width={64}
                height={64}
                className="rounded-xl size-20"
              />
            </div> */}
            <div className="space-y-1 min-w-0">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon
                  className="size-5 text-primary shrink-0"
                  icon={Navigation03Icon}
                />
                <p className="line-clamp-1">{item.pickup?.address ?? ""}</p>
              </h3>
              <h3 className="text-base font-semibold flex items-center gap-2">
                <HugeiconsIcon
                  className="size-5 text-primary shrink-0"
                  icon={Location01Icon}
                />
                <p className="line-clamp-1">
                  {item.destination?.address ?? ""}
                </p>
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {statusText(t, item.type)} ·{" "}
                <bdi>
                  {item.departureDate} {item.departureTime}
                </bdi>
              </p>
              {overdue && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {t("admin.bookings.overdue")}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="bg-white mx-4 rounded-lg p-4">
            <Table>
              <TableBody>
                {invoiceData.map((row, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static list
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {row.label}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        "highlight" in row &&
                        "text-transparent bg-linear-to-r from-cyan-500 to-purple-600 bg-clip-text",
                      )}
                    >
                      <bdi>{row.value}</bdi>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:min-w-[70dvw] max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between pr-8">
          <div>
            <DialogTitle className="text-xl font-bold">
              {t("admin.bookings.details")}
            </DialogTitle>
            <DialogDescription>
              {referenceLabel}:{" "}
              <span className="text-primary font-medium font-mono">
                {shownId}
              </span>
            </DialogDescription>
          </div>
          <Badge className={cn("h-7 px-3 text-sm font-medium", statusColor)}>
            {statusText(t, item.status)}
          </Badge>
        </DialogHeader>
        {/* Route */}
        <div className="flex items-start gap-4 mt-2">
          {/* <Image
            src="https://placehold.co/100x80.png"
            alt="Map"
            width={100}
            height={80}
            className="rounded-lg object-cover shrink-0"
          /> */}
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {statusText(t, item.type)} ·{" "}
              <bdi>
                {item.departureDate} {item.departureTime}
              </bdi>
            </p>
            <p className="text-sm font-medium flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Navigation03Icon}
              />
              <span className="line-clamp-2">{item.pickup?.address ?? ""}</span>
            </p>
            <p className="text-sm font-medium flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Location01Icon}
              />
              <span className="line-clamp-2">
                {item.destination?.address ?? ""}
              </span>
            </p>
          </div>
        </div>

        {isPending && (
          <div className="flex justify-center items-center py-12 text-muted-foreground text-sm">
            {t("admin.bookings.loadingRide")}
          </div>
        )}

        {ride && (
          <>
            {/* Driver + Vehicle */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  {t("admin.bookings.colDriver")}
                </p>
                {ride.driverId ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage
                        src={ride.driverId.profileImage ?? undefined}
                        alt={ride.driverId.name}
                      />
                      <AvatarFallback>
                        {initials(ride.driverId.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {ride.driverId.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ride.driverId.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ride.driverId.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">—</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2 font-medium">
                  {t("admin.bookings.vehicle")}
                </p>
                {ride.vehicleId ? (
                  <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
                    <p className="font-semibold">{ride.vehicleId.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ride.vehicleId.number} · {ride.vehicleId.year} ·{" "}
                      {t("admin.bookings.vehicleSeats", {
                        count: ride.vehicleId.seats,
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm">—</p>
                )}
              </div>
            </div>

            {/* Passengers */}
            <div className="mt-4">
              {settlement && (
                <div className="mb-4">
                  <SplitSettlementCard settlement={settlement} />
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-3 font-medium">
                {t("admin.bookings.passengers", {
                  count: ride.passengers.length,
                })}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ride.passengers.map((p) => (
                  <PassengerCard key={p._id} p={p} />
                ))}
              </div>
            </div>
          </>
        )}
        <DialogFooter>
          {ride && <DeleteRideButton rideId={ride?._id} />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Past({ data }: { data: AdminBooking[] }) {
  return (
    <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 grid-rows-2 gap-6">

      {data?.map((item) => (
        <RideDialog key={item._id} item={item} />
      ))}
    </div>
  );
}
