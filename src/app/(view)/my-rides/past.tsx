"use client";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useAllMyBookings } from "@/hooks/booking/use-booking";
import { useMyRides } from "@/hooks/booking/use-ride";
import { useT } from "@/i18n";
import { paginate } from "@/lib/admin-list";
import { isBookingUnpaid } from "@/lib/is-booking-paid";
import { cn } from "@/lib/utils";
import { BookingCard } from "./booking-card";
import { RideCard } from "./ride-card";

export type RidesTab = "ongoing" | "upcoming" | "past" | "cancelled";

interface PastProps {
  type: RidesTab;
}

const PAGE_LIMIT = 10;

function SkeletonGrid() {
  return (
    <div className="h-full w-full mt-12 grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 grid-rows-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
        <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ type }: { type: string }) {
  return (
    <div className="flex items-center justify-center w-full h-full text-muted-foreground">
      No {type} found.
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3 items-center justify-center w-full h-full text-muted-foreground">
      {t("error.loadFailed")}
      <Button variant="outline" onClick={onRetry}>
        {t("common.tryAgain")}
      </Button>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onPageChange(page - 1)}
            className={cn(page <= 1 && "pointer-events-none opacity-50")}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              onClick={() => onPageChange(p)}
              isActive={p === page}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onPageChange(page + 1)}
            className={cn(
              page >= totalPages && "pointer-events-none opacity-50",
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default function Past({ type }: PastProps) {
  const [page, setPage] = useState(1);

  const showBookings = type === "upcoming";

  // Upcoming tab → bookings
  const {
    data: bookingData,
    isLoading: bookingsLoading,
    isError: bookingsError,
    refetch: refetchBookings,
  } = useAllMyBookings({ enabled: showBookings });
  // Unpaid bookings are not listed (client decision).
  const bookingPage = paginate(
    (bookingData ?? []).filter((b) => !isBookingUnpaid(b.paymentStatus)),
    page,
    PAGE_LIMIT,
  );
  const bookings = bookingPage.items;

  // Ongoing / Past tabs → rides with API status filter
  // Ongoing: status=started, Past: status=completed
  // Cancelled: status=cancelled
  const rideStatus = (
    { ongoing: "started", past: "completed", cancelled: "cancelled" } as const
  )[type as Exclude<RidesTab, "upcoming">];
  const {
    data: rideData,
    isLoading: ridesLoading,
    isError: ridesError,
    refetch: refetchRides,
  } = useMyRides({
    status: rideStatus,
    page,
    limit: PAGE_LIMIT,
    enabled: !showBookings,
  });
  const rides = rideData?.data ?? [];
  const rideTotalPages = rideData?.pagination?.totalPage ?? 1;

  const handlePageChange = (newPage: number) => setPage(newPage);

  if (showBookings) {
    if (bookingsLoading) return <SkeletonGrid />;
    if (bookingsError) return <ErrorState onRetry={refetchBookings} />;
    if (bookings.length === 0) return <EmptyState type={type} />;

    return (
      <div className="h-full w-full mt-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 grid-rows-2 gap-6">
          {bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
        <PaginationBar
          page={bookingPage.page}
          totalPages={bookingPage.totalPage}
          onPageChange={handlePageChange}
        />
      </div>
    );
  }

  if (ridesLoading) return <SkeletonGrid />;
  if (ridesError) return <ErrorState onRetry={refetchRides} />;
  if (rides.length === 0) return <EmptyState type={type} />;

  return (
    <div className="h-full w-full mt-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 grid-rows-2 gap-6">
        {rides.map((ride: any) => (
          <RideCard key={ride._id} ride={ride} />
        ))}
      </div>
      <PaginationBar
        page={page}
        totalPages={rideTotalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
