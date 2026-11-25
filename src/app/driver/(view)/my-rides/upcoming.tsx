"use client";
import {
  Car01Icon,
  Location01Icon,
  Navigation03Icon,
  TickIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDriverBookings } from "@/hooks/booking/use-booking";
import { useNow, useOrderList } from "@/hooks/driver/use-order-list";
import { useSocket } from "@/hooks/shared/use-socket";
import { useT } from "@/i18n";
import { bookingFacts } from "@/lib/driver-orders";
import { refreshRideLists } from "@/lib/refresh-rides";
import { departureLabel } from "@/lib/ride-time";
import { emitAck } from "@/lib/socket-ack";
import { cn } from "@/lib/utils";
import type {
  DriverBooking,
  DriverBookingPassenger,
} from "@/types/booking.types";
import { useQueryClient } from "@tanstack/react-query";
import {
  NoMatchingOrders,
  OrderToolbar,
  PickupBadge,
} from "../_components/order-toolbar";

type BookingWithPassenger = DriverBooking & {
  passengerId: DriverBookingPassenger;
};

function UpcomingCard({
  booking,
  now,
}: {
  booking: BookingWithPassenger;
  now: number;
}) {
  const { socket } = useSocket();
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const p = booking.passengerId;
  const qcl = useQueryClient();
  // Early return if rideId is missing
  if (!booking.rideId) {
    return null;
  }

  async function handleStart(e: React.MouseEvent) {
    e.preventDefault();
    if (started || starting) return;
    setStarting(true);
    const result = await emitAck(
      socket,
      "driver:start-trip",
      { rideId: booking.rideId._id },
      { timeoutMs: 10000 },
    );
    setStarting(false);
    if (result.ok) {
      setStarted(true);
      toast.success(result.message || "Trip started!");
    } else {
      toast.error(result.message);
    }
    refreshRideLists(qcl);
  }

  const departure = departureLabel(p);

  const rows = [
    { label: "Date", value: `${departure.date} · ${departure.time}` },
    { label: "Passenger", value: booking.userId.name },
    { label: "Seats", value: String(p.requestedSeats) },
    {
      label: "Vehicle",
      value: booking.rideId?.vehicleId
        ? `${booking.rideId.vehicleId.name} (${booking.rideId.vehicleId.number})`
        : "Not assigned",
    },
    { label: "Total Fare", value: `€${booking.totalFare.toFixed(2)}` },
    { label: "Paid Amount", value: `€${booking.amountPaid.toFixed(2)}` },
    { label: "Payment Status", value: booking.paymentStatus },
    {},
  ];

  return (
    <Card className="bg-muted pb-0" key={booking._id}>
      <CardHeader className="flex flex-row justify-start items-start gap-4">
        <div className="flex-1 space-y-1">
          <Link
            href={`/driver/my-rides/${booking.rideId._id}`}
            className="space-y-1 block"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Navigation03Icon}
              />
              <span className="truncate">{p.pickup.address}</span>
            </h3>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Location01Icon}
              />
              <span className="truncate">{p.destination.address}</span>
            </h3>
          </Link>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PickupBadge order={bookingFacts(booking)} now={now} />
            <Badge
              className={cn(
                booking?.bookingStatus === "running"
                  ? "bg-amber-100 text-amber-700 border-amber-200"
                  : booking?.bookingStatus === "completed" ||
                      booking?.bookingStatus === "accepted"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200",
              )}
            >
              {booking?.bookingStatus}
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {booking.rideId.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-white mx-4 rounded-lg p-4 mb-4 space-y-3">
        <Table>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="text-muted-foreground py-1.5 text-xs">
                  {item.label}
                </TableCell>
                <TableCell
                  className={`font-medium text-xs text-right${item.label === "Fare" ? " text-primary font-semibold" : ""}`}
                >
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {booking?._id && booking?.bookingStatus === "accepted" ? (
          <div className="p-0.5 rounded-full bg-linear-to-r from-cyan-400/80 to-violet-500/80 w-full">
            <Button
              variant="outline"
              className="w-full bg-secondary rounded-full"
              onClick={(e) => void handleStart(e)}
              disabled={started || starting}
            >
              <HugeiconsIcon icon={TickIcon} className="size-4" />
              {started ? "Trip Started" : "Start Driving"}
            </Button>
          </div>
        ) : (
          <div className="p-0.5 rounded-full bg-linear-to-r from-cyan-400/80 to-violet-500/80 w-full">
            <Button
              variant="outline"
              className="w-full bg-secondary rounded-full"
              asChild
            >
              <Link href={`/driver/my-rides/${booking.rideId._id}`}>
                View Ride
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Upcoming() {
  const t = useT();
  const { data, isPending, isError, refetch } = useDriverBookings();
  const bookings = (data?.data ?? []).filter(
    (b): b is BookingWithPassenger =>
      b.passengerId !== null &&
      !!b.rideId &&
      b.bookingStatus !== "cancelled" &&
      b.bookingStatus !== "completed" &&
      b.bookingStatus !== "running",
  );
  const now = useNow();
  const { visible, controls } = useOrderList(
    bookings,
    bookingFacts,
    "open",
    now,
  );

  if (isPending) {
    return (
      <div className="h-full w-full mt-12 grid md:grid-cols-4 md:grid-rows-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          <Card key={i} className="bg-muted animate-pulse h-48" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-3">
        <p>{t("error.loadFailed")}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
        <HugeiconsIcon
          icon={Car01Icon}
          className="size-8 text-muted-foreground/40"
        />
        <p>No upcoming rides</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full mt-6 space-y-6">
      <OrderToolbar controls={controls} />
      {visible.length === 0 && <NoMatchingOrders />}
      <div className="w-full grid md:grid-cols-4 md:grid-rows-2 gap-6">
        {visible.map((booking) => (
          <UpcomingCard key={booking._id} booking={booking} now={now} />
        ))}
      </div>
    </div>
  );
}
