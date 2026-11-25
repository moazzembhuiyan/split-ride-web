"use client";
import {
  Car01Icon,
  DownloadIcon,
  Location01Icon,
  Navigation03Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDriverBookings } from "@/hooks/booking/use-booking";
import { useNow, useOrderList } from "@/hooks/driver/use-order-list";
import { bookingFacts } from "@/lib/driver-orders";
import { isBookingPaid } from "@/lib/is-booking-paid";
import { useT } from "@/i18n";
import { departureLabel } from "@/lib/ride-time";
import { cn } from "@/lib/utils";
import type {
  DriverBooking,
  DriverBookingPassenger,
} from "@/types/booking.types";
import { Button } from "@/components/ui/button";
import { NoMatchingOrders, OrderToolbar } from "../_components/order-toolbar";

type BookingWithPassenger = DriverBooking & {
  passengerId: DriverBookingPassenger;
};

function statusBadge(bookingStatus: string, paymentStatus: string) {
  if (bookingStatus === "cancelled") {
    return (
      <Badge className="bg-red-100 text-red-600 border-red-200">
        Cancelled
      </Badge>
    );
  }
  if (paymentStatus === "paid") {
    return (
      <Badge className="text-[10px] bg-linear-to-r from-cyan-400/80 to-violet-500/80">
        Paid
      </Badge>
    );
  }
  return <Badge variant="outline">Pending</Badge>;
}

export default function Past() {
  const t = useT();
  const { data, isPending, isError, refetch } = useDriverBookings();
  const bookings = (data?.data ?? []).filter(
    (b): b is BookingWithPassenger =>
      b.passengerId !== null &&
      !!b.rideId &&
      (isBookingPaid(b.paymentStatus) || b.bookingStatus === "cancelled"),
  );
  const now = useNow();
  const { visible, controls } = useOrderList(
    bookings,
    bookingFacts,
    "history",
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
        <p>No bookings found</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full mt-6 space-y-6">
      <OrderToolbar controls={controls} />
      {visible.length === 0 && <NoMatchingOrders />}
      <div className="w-full grid md:grid-cols-4 md:grid-rows-2 gap-6">
      {visible.map((booking) => {
        const p = booking.passengerId;
        const departure = departureLabel(p);
        const rows = [
          { label: "Booking ID", value: booking.id },
          { label: "Date", value: `${departure.date} · ${departure.time}` },
          { label: "Passenger", value: booking.userId.name },
          { label: "Seats", value: String(p.requestedSeats) },
          {
            label: "Vehicle",
            value: booking.rideId?.vehicleId
              ? `${booking.rideId.vehicleId.name} (${booking.rideId.vehicleId.number})`
              : "Not assigned",
          },
          { label: "Fare", value: `€${booking.totalFare.toFixed(2)}` },
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
                <div className="flex items-center gap-2 pt-1">
                  {statusBadge(booking.bookingStatus, booking.paymentStatus)}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {booking.rideId.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-white mx-4 rounded-lg p-4 mb-4">
              <Table>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className="text-muted-foreground py-1.5 text-xs">
                        {item.label}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium text-xs text-right",
                          item.label === "Fare" && "text-primary font-semibold",
                        )}
                      >
                        {item.label === "Booking ID" ? (
                          <span className="flex items-center justify-end gap-1">
                            <HugeiconsIcon
                              icon={Ticket01Icon}
                              className="size-3 text-violet-500"
                            />
                            {item.value}
                          </span>
                        ) : (
                          item.value
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
