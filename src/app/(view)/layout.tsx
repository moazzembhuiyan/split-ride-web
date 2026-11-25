import Navbar from "@/components/core/navbar";
import React, { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:h-dvh w-full flex flex-col items-start justify-start relative lg:overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full z-30 h-full">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}
