"use client";
import Navbar from "@/components/core/navbar";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import React, { Suspense } from "react";

export default function MessageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useT();
  const { data, isError, refetch } = useMe();
  if (!data && isError) {
    return (
      <div className="min-h-dvh flex flex-col gap-3 items-center justify-center text-muted-foreground">
        {t("error.loadFailed")}
        <Button variant="outline" onClick={() => void refetch()}>
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }
  if (!data) return null;
  const isDriverContext = data?.data.role === "provider";
  return (
    <div className="h-dvh w-full flex min-h-0 flex-col items-start justify-start relative overflow-hidden">
      <Navbar driver={isDriverContext} />
      <main className="flex min-h-0 flex-1 w-full z-30 h-full">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
