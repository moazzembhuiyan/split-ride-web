"use client";

import { useEffect, useState } from "react";
import { getFcmToken } from "@/lib/firebase";

export function useFcmToken() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    Notification.requestPermission().then((permission) => {
      if (permission !== "granted") return;
      getFcmToken().then(setFcmToken);
    });
  }, []);

  return fcmToken;
}
