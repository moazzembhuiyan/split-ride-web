"use client";
import { Location01Icon, Navigation03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { departureLabel } from "@/lib/ride-time";
import { cn } from "@/lib/utils";

export function RideCard({ ride }: { ride: any }) {
  const departure = departureLabel(ride);
  const invoiceData = [
    { label: "Ride ID", value: ride?.id?.slice(-8).toUpperCase() ?? "N/A" },
    {
      label: "Date & Time",
      value: `${departure.time} - ${departure.date}`,
    },
    {
      label: "Driver",
      value:
        typeof ride.driver === "object"
          ? (ride.driver as unknown as { name: string }).name
          : ride.driver,
    },
    { label: "Seats", value: String(ride.requestedSeats) },
    { label: "Status", value: ride.status ?? ride.rideStatus },
  ];

  return (
    <Card className="bg-muted pb-0">
      <CardHeader className="flex flex-row justify-start items-start gap-4">
        <Link
          href={`/my-rides/${ride.passengerId}`}
          className="flex items-center gap-4"
        >
          <Image
            src="https://placehold.co/64.png"
            alt="Ride"
            width={64}
            height={64}
            className="rounded-xl size-20"
          />
        </Link>
        <div className="space-y-1">
          <Link
            href={`/my-rides/${ride.passengerId}`}
            className="gap-4 space-y-1"
          >
            <h3 className="text-base font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Navigation03Icon}
              />
              {ride.pickup?.address}
            </h3>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-5 text-primary"
                icon={Location01Icon}
              />
              {ride.destination?.address}
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
                    item.label === "Status" &&
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
