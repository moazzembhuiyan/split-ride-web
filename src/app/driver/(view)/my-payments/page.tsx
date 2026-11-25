"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDriverBookings } from "@/hooks/booking/use-booking";
import { useMe } from "@/hooks/shared/use-user";
import type { DriverBooking } from "@/types/booking.types";
import { TransactionList } from "./_components/transaction-list";

type Filter = "today" | "day" | "week" | "month" | "custom";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inRange(iso: string | undefined, from: Date, to: Date) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function bookingDate(b: DriverBooking) {
  return b.passengerId?.departureDate ?? b.createdAt;
}

export default function Page() {
  const { data: meData } = useMe();
  const me = meData?.data;
  const { data, isPending } = useDriverBookings("completed");
  const bookings = data?.data ?? [];

  const [filter, setFilter] = useState<Filter>("month");
  const [day, setDay] = useState(() => new Date().toISOString().split("T")[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    let start = today;
    let end = new Date(today);
    end.setHours(23, 59, 59, 999);

    if (filter === "week") {
      start = new Date(today);
      start.setDate(start.getDate() - 6);
    } else if (filter === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (filter === "day") {
      start = startOfDay(new Date(`${day}T00:00:00`));
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (filter === "custom" && from && to) {
      start = startOfDay(new Date(`${from}T00:00:00`));
      end = new Date(`${to}T23:59:59`);
    }

    return bookings.filter((b) => inRange(bookingDate(b), start, end));
  }, [bookings, filter, day, from, to]);

  const earned = filtered.reduce(
    (sum, b) => sum + Number(b.amountPaid || b.totalFare || 0),
    0,
  );

  return (
    <div className="relative h-full flex flex-col items-center w-full p-4 sm:p-8 md:p-12 max-h-[90dvh] overflow-y-auto gap-6">
      <h1 className="text-2xl font-bold self-start">Earnings</h1>

      <div className="w-full max-w-2xl rounded-2xl bg-linear-to-r from-cyan-400 to-violet-500 p-6 text-white text-center">
        <p className="text-sm font-medium text-white/80 mb-1">Total earnings</p>
        <p className="text-4xl font-bold">
          € {Number(me?.lifetimeEarnings ?? me?.totalEarning ?? earned).toFixed(2)}
        </p>
        <p className="text-sm text-white/80 mt-2">
          {me?.completedRides ?? filtered.length} completed rides
        </p>
      </div>

      <div className="w-full max-w-2xl flex flex-wrap gap-2">
        {(
          [
            ["today", "Today"],
            ["day", "Specific day"],
            ["week", "Week"],
            ["month", "Month"],
            ["custom", "Custom range"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={filter === id ? "default" : "outline"}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {filter === "day" && (
        <Input
          type="date"
          className="max-w-2xl"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        />
      )}
      {filter === "custom" && (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-3">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading earnings…</p>
      ) : (
        <TransactionList bookings={filtered} />
      )}
    </div>
  );
}
