"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFcmToken } from "@/hooks/shared/use-fcm";
import { useQueryClient } from "@tanstack/react-query";
import { useMe, useUpdateMe } from "@/hooks/shared/use-user";
import { ApiError } from "@/lib/api";
import { getMessagingRegistration } from "@/lib/firebase";
import { refreshRideLists } from "@/lib/refresh-rides";
import { authService } from "@/services/auth.service";

/** Registers FCM after login so drivers can receive booking pushes in the background. */
export function FcmRegistrar() {
  const token = useFcmToken();
  const { data } = useMe();
  const { mutate: updateMe } = useUpdateMe();
  const queryClient = useQueryClient();
  const sentRef = useRef<string | null>(null);
  const user = data?.data;

  useEffect(() => {
    if (!token || !user?._id) return;
    if (user.fcmToken === token) return;
    // Per account: another user of this browser needs the token sent again.
    const sent = `${user._id}:${token}`;
    if (sentRef.current === sent) return;
    sentRef.current = sent;
    authService.updateFcmToken(token).catch((error) => {
      // API builds without this endpoint take the token with the profile.
      if (error instanceof ApiError && error.status === 404) {
        updateMe({ fcmToken: token });
      } else {
        sentRef.current = null;
      }
    });
  }, [token, user?._id, user?.fcmToken, updateMe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let unsub: (() => void) | undefined;
    let cancelled = false;

    async function listenForeground() {
      try {
        type FirebaseMessagingApi = {
          isSupported: () => Promise<boolean>;
          getMessaging: (firebaseApp: unknown) => unknown;
          onMessage: (
            messaging: unknown,
            observer: (payload: {
              notification?: { title?: string; body?: string };
              data?: { body?: string };
            }) => void,
          ) => () => void;
        };
        const messagingApi = (await import(
          "firebase/messaging"
        )) as unknown as FirebaseMessagingApi;
        const supported = await messagingApi.isSupported();
        if (!supported || cancelled) return;
        const { getApp } = await import("firebase/app");
        const messaging = messagingApi.getMessaging(getApp());
        await getMessagingRegistration();
        unsub = messagingApi.onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? "Split Ride";
          const body = payload.notification?.body ?? payload.data?.body;
          toast.info(body ? `${title}: ${body}` : title);
          refreshRideLists(queryClient);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["user", "me"] });
        });
      } catch {
        // Messaging is optional on unsupported browsers.
      }
    }

    void listenForeground();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [queryClient]);

  return null;
}
