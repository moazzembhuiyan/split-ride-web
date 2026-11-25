"use client";
import { Location01Icon, Navigation03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { departureLabel } from "@/lib/ride-time";
import { cn } from "@/lib/utils";
import type { Booking } from "@/types/booking.types";

export function BookingCard({ booking }: { booking: Booking }) {
  const passenger = booking.passengerId;
  const ride = booking.rideId;
  const pickupAddr = passenger?.pickup?.address ?? "N/A";
  const destAddr = passenger?.destination?.address ?? "N/A";
  const departure = departureLabel(passenger);
  const driverName = booking.driverId?.name ?? "—";
  const vehicleName = ride?.vehicleId?.name ?? "—";
  const vehicleNumber = ride?.vehicleId?.number ?? "—";
  const requestedSeats = passenger?.requestedSeats ?? "—";

  const invoiceData = [
    {
      label: "Booking ID",
      value: /^SR-/i.test(booking.id ?? "")
        ? booking.id
        : (booking.id?.slice(-8).toUpperCase() ?? "N/A"),
    },
    { label: "Date & Time", value: `${departure.time} - ${departure.date}` },
    { label: "Driver", value: driverName },
    { label: "Vehicle", value: `${vehicleName} (${vehicleNumber})` },
    { label: "Seats", value: String(requestedSeats) },
    { label: "Fare", value: `€${booking.totalFare?.toFixed(2) ?? "0.00"}` },
    { label: "Status", value: booking.bookingStatus },
    { label: "Payment", value: booking.paymentStatus },
  ];

  return (
    <Card className="bg-muted pb-0">
      <CardHeader className="flex flex-row justify-start items-start gap-4">
        <Link href={`/book/${booking._id}`} className="flex items-center gap-4">
          <Image
            src="https://placehold.co/64.png"
            alt="Ride"
            width={64}
            height={64}
            className="rounded-xl size-20"
          />
        </Link>
        <div className="space-y-1">
          <Link href={`/book/${booking._id}`} className="gap-4 space-y-1">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Navigation03Icon}
              />
              {pickupAddr}
            </h3>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Location01Icon}
              />
              {destAddr}
            </h3>
          </Link>
          <h4 className="text-sm text-primary hover:underline cursor-pointer">
            Download Invoice
          </h4>
        </div>
      </CardHeader>
      <CardContent className="bg-white mx-4 rounded-lg p-4">
        <Table>
          <TableBody>
            {invoiceData.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">
                  {item.label}
                </TableCell>
                <TableCell
                  className={cn(
                    "font-medium",
                    (item.label === "Status" || item.label === "Payment") &&
                      "text-transparent bg-linear-to-r from-cyan-500 to-purple-600 bg-clip-text",
                  )}
                >
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
