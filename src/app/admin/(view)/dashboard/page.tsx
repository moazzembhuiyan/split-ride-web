"use client";

import {
  AddTeamIcon,
  Car01Icon,
  DollarCircleIcon,
  MoreVerticalCircle01Icon,
  ShoppingCart01Icon,
  ShoppingCart02Icon,
  TrendingUpDownIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminMeta } from "@/hooks/admin/use-admin";
import { useT } from "@/i18n";
import type { MetaAmountSort } from "@/types/admin.types";
import { ChartBar } from "../_components/dummy-chart";
import { DummyDonut, type DonutItem } from "../_components/dummy-donut";
import { TransactionsTable } from "../_components/transactions-table";

function fmt(n: number) {
  return `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Page() {
  const t = useT();
  const [amountSort, setAmountSort] = React.useState<MetaAmountSort | undefined>(
    undefined,
  );
  const { data, isPending } = useAdminMeta(amountSort);
  const meta = data?.data;

  const statistics = [
    {
      icon: DollarCircleIcon,
      label: t("admin.dashboard.newNetIncome"),
      value: meta ? fmt(meta.salesReport.netIncome) : "—",
    },
    {
      icon: ShoppingCart01Icon,
      label: t("admin.dashboard.totalRides"),
      value: meta ? meta.totalBookings.toLocaleString() : "—",
    },
    {
      icon: AddTeamIcon,
      label: t("admin.dashboard.totalUsers"),
      value: meta ? meta.totalUsers.toLocaleString() : "—",
    },
    {
      icon: Car01Icon,
      label: t("admin.dashboard.totalDrivers"),
      value: meta ? meta.totalDrivers.toLocaleString() : "—",
    },
  ];

  const salesItems = meta
    ? [
      {
        color: "bg-chart-1",
        label: t("admin.dashboard.newNetIncome"),
        pct:
          meta.salesReport.totalIncome > 0
            ? (
              (meta.salesReport.netIncome / meta.salesReport.totalIncome) *
              100
            ).toFixed(1)
            : "0.0",
      },
      {
        color: "bg-chart-2",
        label: t("admin.dashboard.expense"),
        pct:
          meta.salesReport.totalIncome > 0
            ? (
              (meta.salesReport.platformCommission /
                meta.salesReport.totalIncome) *
              100
            ).toFixed(1)
            : "0.0",
      },
      {
        color: "bg-muted",
        label: t("admin.dashboard.cancellation"),
        pct:
          meta.salesReport.totalIncome > 0
            ? (
              (meta.salesReport.refunded / meta.salesReport.totalIncome) *
              100
            ).toFixed(1)
            : "0.0",
      },
    ]
    : [
      {
        color: "bg-chart-3",
        label: t("admin.dashboard.totalIncome"),
        pct: "—",
      },
      {
        color: "bg-chart-1",
        label: t("admin.dashboard.newNetIncome"),
        pct: "—",
      },
      { color: "bg-chart-2", label: t("admin.dashboard.expense"), pct: "—" },
      {
        color: "bg-muted",
        label: t("admin.dashboard.cancellation"),
        pct: "—",
      },
    ];
  // Older API builds do not send these figures.
  const bookingItems = [
    {
      label: t("admin.dashboard.completedBookings"),
      value: meta?.completedBookings?.toLocaleString(),
    },
    {
      label: t("admin.dashboard.cancelledBookings"),
      value: meta?.cancelledBookings?.toLocaleString(),
    },
    {
      label: t("admin.dashboard.cancellationRate"),
      value:
        meta?.cancellationRate == null
          ? undefined
          : `${Number(meta.cancellationRate).toFixed(1)}%`,
    },
    {
      label: t("admin.dashboard.totalRefunded", {
        count: meta?.totalRefundCount ?? 0,
      }),
      value:
        meta?.totalRefunded == null ? undefined : fmt(meta.totalRefunded),
    },
  ].filter((item) => item.value !== undefined);

  const donutData: DonutItem[] = meta
    ? [
      {
        key: "income",
        label: t("admin.dashboard.newNetIncome"),
        value: meta.salesReport.netIncome,
        fill: "var(--color-income)",
      },
      {
        key: "expense",
        label: t("admin.dashboard.expense"),
        value: meta.salesReport.platformCommission,
        fill: "var(--color-expense)",
      },
      {
        key: "cancellation",
        label: t("admin.dashboard.cancellation"),
        value: meta.salesReport.refunded,
        fill: "var(--color-cancellation)",
      },
    ]
    : [];

  return (
    <main className="h-full w-full p-3 sm:p-4 space-y-4">
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statistics.map((stat) => (
            <Card className="ring-0 flex flex-col" key={stat.label}>
              <CardHeader className="flex items-start gap-4 justify-between">
                <div className="pl-2 flex items-center min-w-0">
                  <div className="size-10 bg-primary/30 rounded-full relative shrink-0">
                    <div className="size-2 bg-primary/30 rounded-full -top-1 -left-1 absolute" />
                    <HugeiconsIcon
                      className="size-10 text-primary absolute -bottom-1.5 -right-1.5"
                      icon={stat.icon}
                    />
                  </div>
                  <h3 className="ml-4 text-base sm:text-lg font-semibold truncate">
                    {stat.label}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  className="size-10 text-muted-foreground rounded-full p-2 shrink-0"
                  asChild
                >
                  <Link
                    href={
                      stat?.label === t("admin.dashboard.newNetIncome")
                        ? "/admin/transactions"
                        : stat?.label === t("admin.dashboard.totalRides")
                          ? "/admin/bookings"
                          : stat?.label === t("admin.dashboard.totalUsers")
                            ? "/admin/users"
                            : stat?.label === t("admin.dashboard.totalDrivers")
                              ? "/admin/drivers"
                              : "#"
                    }
                  >
                    <HugeiconsIcon
                      className="size-5"
                      icon={MoreVerticalCircle01Icon}
                    />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="flex-1 grid grid-cols-5 gap-4 pt-0 min-h-0">
                <div className="flex flex-col space-y-2 items-center justify-end gap-2 pb-1 col-span-3">
                  <h3 className="text-3xl sm:text-5xl tracking-tight w-full">
                    {isPending ? (
                      <span className="text-muted-foreground text-2xl">
                        {t("admin.common.loading")}
                      </span>
                    ) : (
                      stat.value
                    )}
                  </h3>
                  <div className="pb-12"></div>
                </div>
                <div className="min-h-0 pt-[20%] col-span-2">
                  <ChartBar />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-xl bg-white ring-0">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("admin.dashboard.salesReport")}</CardTitle>
            {/* <Select>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent
                align="end"
                side="bottom"
                position="popper"
                className="p-2"
              >
                <SelectItem value="week">
                  {t("admin.dashboard.lastWeek")}
                </SelectItem>
                <SelectItem value="month">
                  {t("admin.dashboard.lastMonth")}
                </SelectItem>
                <SelectItem value="year">
                  {t("admin.dashboard.lastYear")}
                </SelectItem>
              </SelectContent>
            </Select> */}
          </CardHeader>
          <CardContent className="aspect-square mx-[10%] sm:mx-[15%] flex justify-center items-center relative">
            <DummyDonut data={donutData} />
            <div className="p-4 bg-accent text-primary rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <HugeiconsIcon icon={ShoppingCart02Icon} />
            </div>
          </CardContent>
          <CardContent className="flex-1 flex justify-around items-start flex-col w-full">
            {salesItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 mb-2 w-full"
              >
                <div className={`size-4 ${item.color} rounded-full shrink-0`} />
                {item.label}
                <span className="ml-auto font-bold">
                  {item.pct !== "—" ? `${item.pct}%` : "—"}
                </span>
              </div>
            ))}
            {bookingItems.length > 0 && (
              <div className="w-full border-t mt-2 pt-4">
                {bookingItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 mb-2 w-full"
                  >
                    {item.label}
                    <span className="ms-auto font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl bg-muted/50">
        <div className="w-full flex justify-between items-center pt-4 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold px-4">
            {t("admin.dashboard.recentTransactions")}
          </h2>
          <Button variant="link" className="px-4 text-primary" asChild>
            <Link href="/admin/transactions">
              {t("admin.dashboard.viewAll")}
            </Link>
          </Button>
        </div>
        <TransactionsTable
          transactions={meta?.recentTransactions ?? []}
          amountSort={amountSort}
          onAmountSortChange={setAmountSort}
        />
      </div>
    </main>
  );
}
