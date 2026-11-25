"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DriverBooking } from "@/types/booking.types";

export function TransactionList({ bookings }: { bookings: DriverBooking[] }) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No completed rides in this period.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl">
      {bookings.map((b) => {
        const p = b.passengerId;
        return (
          <Card key={b._id} className="py-0 shadow-none">
            <CardContent className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    Booking {b.id ?? b._id}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {p?.pickup.address ?? "—"} → {p?.destination.address ?? "—"}
                  </p>
                </div>
                <p className="font-bold text-sm shrink-0">
                  € {Number(b.amountPaid || b.totalFare || 0).toFixed(2)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {p?.departureDate ?? b.createdAt.slice(0, 10)} ·{" "}
                {p?.departureTime ?? ""} · {b.paymentStatus || b.bookingStatus}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
