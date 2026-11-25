"use client";
import {
  Car01Icon,
  Location01Icon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useDriverRides } from "@/hooks/driver/use-driver-ride";
import { useNow, useOrderList } from "@/hooks/driver/use-order-list";
import { useT } from "@/i18n";
import { rideFacts } from "@/lib/driver-orders";
import { departureLabel } from "@/lib/ride-time";
import type { Ride } from "@/types/ride.types";
import { OrderToolbar } from "../_components/order-toolbar";

function OngoingCard({ ride }: { ride: Ride }) {
  const departure = departureLabel(ride);
  const rows = [
    { label: "Date", value: `${departure.date} · ${departure.time}` },
    { label: "Type", value: ride.rideType },
    { label: "Booked Seats", value: String(ride.availableSeats ?? 0) },
    { label: "Status", value: ride.status },
  ];

  return (
    <Card className="bg-muted pb-0">
      <CardHeader className="flex flex-row justify-start items-start gap-4">
        <div className="flex-1 space-y-1">
          <Link
            href={`/driver/my-rides/${ride._id}`}
            className="space-y-1 block"
          >
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Navigation03Icon}
              />
              <span className="truncate">{ride.pickup.address}</span>
            </h3>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <HugeiconsIcon
                className="size-4 text-primary shrink-0"
                icon={Location01Icon}
              />
              <span className="truncate">{ride.destination.address}</span>
            </h3>
          </Link>
          <div className="flex items-center gap-2 pt-1">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Ongoing
            </Badge>
            <Badge variant="outline" className="text-[10px] capitalize">
              {ride.rideType}
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
                <TableCell className="font-medium text-xs text-right capitalize">
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

export default function Ongoing() {
  const t = useT();
  const { data, isPending, isError, refetch } = useDriverRides("started");
  const rides = (data?.data ?? []) as Ride[];
  const now = useNow();
  const { visible, controls } = useOrderList(rides, rideFacts, "ongoing", now);

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

  if (rides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
        <HugeiconsIcon
          icon={Car01Icon}
          className="size-8 text-muted-foreground/40"
        />
        <p>No ongoing rides</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full mt-6 space-y-6">
      {rides.length > 1 && <OrderToolbar controls={controls} />}
      <div className="w-full grid md:grid-cols-4 md:grid-rows-2 gap-6">
        {visible.map((ride) => (
          <OngoingCard key={ride._id} ride={ride} />
        ))}
      </div>
    </div>
  );
}
