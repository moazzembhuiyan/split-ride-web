import Navbar from "@/components/core/navbar";
import React from "react";
import { DriverProvider } from "./driver-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:h-dvh w-full flex flex-col items-start justify-start relative md:overflow-hidden">
      <Navbar driver />
      <main className="flex-1 w-full z-30 bg-white">
        <DriverProvider>{children}</DriverProvider>
      </main>
    </div>
  );
}
