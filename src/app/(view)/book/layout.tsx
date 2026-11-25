"use client";

import type { ReactNode } from "react";
import { useHydrateBookingStore } from "@/store/booking-store";

export default function BookLayout({ children }: { children: ReactNode }) {
  useHydrateBookingStore();
  return children;
}
