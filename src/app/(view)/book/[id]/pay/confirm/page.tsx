"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/types/payment.types";
import type { ApiResponse } from "@/types/base";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon, CheckCircle } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { isPaymentSecured } from "@/lib/is-booking-paid";
import { patchPendingPayment } from "@/lib/pending-payment";
import { useT } from "@/i18n";

export default function Page() {
  const t = useT();
  const params = useParams();
  const bookingId = params?.id as string;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const paymentId = searchParams.get("paymentId") ?? "";
  const canceled = searchParams.get("canceled") === "true";

  const { data, isLoading, isError, error } = useQuery<
    ApiResponse<Payment>,
    Error
  >({
    queryKey: ["confirm-payment", sessionId, paymentId],
    queryFn: () => paymentService.confirmPayment({ sessionId, paymentId }),
    enabled: !!sessionId && !!paymentId && !canceled,
    retry: false,
  });

  const raw = data?.data as unknown;
  const payment =
    raw &&
    typeof raw === "object" &&
    "payment" in raw &&
    (raw as { payment?: Payment }).payment
      ? (raw as { payment: Payment }).payment
      : (raw as Payment | undefined);
  // "processing" is still on its way, not a failure.
  const success =
    isPaymentSecured(payment) ||
    (payment?.status as string | undefined) === "processing";
  const failed = canceled || isError || !sessionId || !paymentId || (!isLoading && !success);

  useEffect(() => {
    if (success) patchPendingPayment({ paid: true, bookingId });
  }, [success, bookingId]);

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Spinner />
            </div>
            <CardTitle className="text-xl">{t("book.select.verifyingPayment")}</CardTitle>
            <CardDescription>
              {t("book.select.verifyingPaymentHint")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Error / Missing params / cancel ───────────────────────────────
  if (failed && !success) {
    return (
      <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="size-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="size-8 text-destructive"
                />
              </div>
            </div>
            <CardTitle className="text-xl text-destructive">
              {t("book.select.paymentFailed")}
            </CardTitle>
            <CardDescription>
              {error?.message ?? t("book.select.bookingNotConfirmed")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/book/select">{t("book.select.retryPayment")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/book/${bookingId}`}>{t("book.select.backToBooking")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="size-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <HugeiconsIcon
                icon={CheckCircle}
                className="size-8 text-emerald-500"
              />
            </div>
          </div>
          <CardTitle className="text-xl text-emerald-600">
            {t("book.select.paymentSuccessful")}
          </CardTitle>
          <CardDescription>
            {t("book.select.paymentConfirmedSearching")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono font-medium">
                {payment?.transactionId}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-primary">
                €{payment?.amount?.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="capitalize">{payment?.method}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="default" className="bg-emerald-500">
                {payment?.status}
              </Badge>
            </div>
          </div>
          <Button asChild>
            <Link href="/book/select">{t("book.select.continue")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/book/${bookingId}`}>{t("book.select.viewBooking")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
