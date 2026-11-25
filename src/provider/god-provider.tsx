"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, Suspense, useState } from "react";
import { CookiesProvider } from "react-cookie";
import { Toaster } from "sonner";
import { useUserIdSync } from "@/hooks/shared/use-user";
import { FcmRegistrar } from "./fcm-registrar";
import { NotificationBridge } from "./notification-bridge";
import { SocketProvider } from "./socket-provider";

function UserSync() {
  useUserIdSync();
  return null;
}

export default function GodProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isDev = process.env.NODE_ENV === "development";
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            retry: 1,
            // Offline requests fail at once (and offer Retry) instead of
            // waiting silently.
            networkMode: "always",
          },
          // Offline actions must not be kept and sent later.
          mutations: { networkMode: "always" },
        },
      })
  );

  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <NotificationBridge />
          <Suspense>
            {children}
            {/* Inside the boundary: a profile that arrives before the page is
                hydrated would not match the server-rendered text. */}
            <UserSync />
            <FcmRegistrar />
          </Suspense>
        </SocketProvider>
        {isDev && <ReactQueryDevtools initialIsOpen={false} />}
        <Toaster richColors position="top-right" visibleToasts={1} />
      </QueryClientProvider>
    </CookiesProvider>
  );
}
