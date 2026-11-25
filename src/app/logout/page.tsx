"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { beginLogout, clearSession, loginPath } from "@/lib/session";
import { destroySocket } from "@/lib/socket";
import { authService } from "@/services/auth.service";
import { useUserStore } from "@/store/user-store";

export default function LogoutPage() {
  const qc = useQueryClient();
  const clearUserId = useUserStore((s) => s.clearUserId);

  useEffect(() => {
    const target = loginPath();
    beginLogout();
    // Sent before the token is removed; the result does not matter.
    const notified = authService.logout().catch(() => {});
    destroySocket();
    clearSession();
    clearUserId();
    qc.clear();
    for (const key of ["driver-store", "booking-draft"]) {
      sessionStorage.removeItem(key);
    }
    localStorage.removeItem("ride-session-store");
    // A full reload drops every listener and cached answer of this account.
    const leave = () => window.location.replace(target);
    void notified.then(leave);
    const timer = window.setTimeout(leave, 1500);
    return () => window.clearTimeout(timer);
  }, [clearUserId, qc]);

  return null;
}
