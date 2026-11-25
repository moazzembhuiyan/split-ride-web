"use client";

import {
  Location01Icon,
  MapPinIcon,
  Navigation03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export default function Past() {
  const t = useT();

  const invoiceData = [
    {
      label: t("admin.bookings.colBookingId"),
      value: "SR1284E6",
    },
    {
      label: t("admin.bookings.colDateTime"),
      value: "16 July 2023, 10:30 PM",
    },
    {
      label: t("admin.bookings.colDriver"),
      value: "John Doe",
    },
    {
      label: t("admin.bookings.colSeats"),
      value: "4",
    },
    {
      label: t("admin.bookings.colPaymentStatus"),
      value: t("admin.bookings.advancePaid"),
    },
  ];

  return (
    <div className="h-full w-full grid grid-cols-1  md:grid-cols-2 2xl:grid-cols-4 grid-rows-2 gap-6 ">
      {Array.from({ length: 12 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
        <Card className="bg-muted " key={i}>
          <CardHeader className="flex flex-row justify-start items-start gap-4">
            <Link
              href="/driver/my-rides/123"
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
              <Link href="/my-rides/123" className="gap-4 space-y-1">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon
                    className="size-5 text-primary"
                    icon={Navigation03Icon}
                  />
                  1901 Thornridge Cir. Shiloh
                </h3>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <HugeiconsIcon
                    className="size-5 text-primary"
                    icon={Location01Icon}
                  />
                  4140 Parker Rd. Allentown
                </h3>
              </Link>
              <h4 className="text-sm text-primary hover:underline cursor-pointer">
                {t("admin.bookings.downloadInvoice")}
              </h4>
            </div>
          </CardHeader>
          <CardContent className="bg-white mx-4 rounded-lg p-4">
            <Table>
              <TableBody>
                {invoiceData.map((item, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">
                      {item.label}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-medium",
                        item.label === t("admin.bookings.colPaymentStatus") &&
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
      ))}


    </div>
  );
}
