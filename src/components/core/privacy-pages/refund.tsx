"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyRefunds } from "@/hooks/booking/use-payment";
import { useT } from "@/i18n";
import type { RefundStatus } from "@/types/payment.types";

const STATUS_STYLES: Record<RefundStatus, string> = {
  pending: "bg-orange-100 text-orange-600 border-orange-200",
  underReview: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-600 border-red-200",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function Refund({ driver }: { driver?: boolean }) {
  const t = useT();
  const { data: refundsData, isLoading } = useMyRefunds();

  const refunds = refundsData?.data ?? [];

  return (
    <div className="p-6 h-full w-full space-y-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">{t("profile.refund.title")}</h1>

      <div className="space-y-6">
        {/* Recent Refunds Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t("profile.refund.recent")}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : refunds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No refunds yet
            </p>
          ) : (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <div
                  key={refund._id}
                  className="flex items-start justify-between p-4 border rounded-xl hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Status badge */}
                    <Badge
                      className={`text-xs font-medium border ${STATUS_STYLES[refund.status]}`}
                      variant="outline"
                    >
                      {refund.status === "underReview"
                        ? "Under Review"
                        : refund.status.charAt(0).toUpperCase() +
                          refund.status.slice(1)}
                    </Badge>

                    {/* Booking Info */}
                    <div className="text-xs text-muted-foreground">
                      {t("profile.refund.bookingId")} {refund.booking}
                    </div>

                    {/* Date/Time */}
                    <div className="text-xs text-muted-foreground">
                      {formatDate(refund.createdAt)} |{" "}
                      {formatTime(refund.createdAt)}
                    </div>

                    {/* Note */}
                    {refund.note && (
                      <p className="text-xs text-muted-foreground italic">
                        {refund.note}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-sm font-semibold text-violet-500 ml-4 shrink-0">
                    € {refund.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
