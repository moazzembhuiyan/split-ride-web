"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stripeService } from "@/services/driver.service";
import type { ConnectExistingStripePayload } from "@/types/driver.types";

export const stripeKeys = {
  status: ["stripe", "status"] as const,
  connection: ["stripe", "connection"] as const,
};

export function useStripeConnectionCheck() {
  return useQuery({
    queryKey: stripeKeys.connection,
    queryFn: () => stripeService.checkConnection(),
  });
}

export function useStripeAccountStatus() {
  return useQuery({
    queryKey: stripeKeys.status,
    queryFn: () => stripeService.getAccountStatus(),
  });
}

export function useConnectStripe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => stripeService.connectStripe(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stripe"] }),
  });
}

export function useConnectExistingStripe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConnectExistingStripePayload) => stripeService.connectExisting(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stripe"] }),
  });
}

export function useDisconnectStripe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => stripeService.disconnect(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stripe"] }),
  });
}
