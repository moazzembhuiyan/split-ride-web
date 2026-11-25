"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { byNewest, fetchAllRows } from "@/lib/admin-list";
import { cardService, paymentService } from "@/services/payment.service";
import type {
  AddCardPayload,
  ChangeRefundStatusPayload,
  CheckoutPayload,
  ConfirmPaymentIntentPayload,
  ConfirmPaymentPayload,
  GetPaymentsQuery,
  RefundPaymentPayload,
  SetDefaultCardPayload,
} from "@/types/payment.types";

export const paymentKeys = {
  all: (query?: GetPaymentsQuery) => ["payments", "all", query] as const,
  detail: (id: string) => ["payments", id] as const,
  myRefunds: ["refunds", "my"] as const,
  allRefunds: ["refunds", "all"] as const,
  refund: (id: string) => ["refunds", id] as const,
  driverBalance: ["payments", "driver", "balance"] as const,
  driverPayments: ["payments", "driver", "payments"] as const,
};

export function useCheckout() {
  return useMutation({
    mutationFn: (payload: CheckoutPayload) => paymentService.checkout(payload),
  });
}

export function useConfirmPayment() {
  return useMutation({
    mutationFn: (payload: ConfirmPaymentPayload) =>
      paymentService.confirmPayment(payload),
  });
}

export function useConfirmPaymentIntent() {
  return useMutation({
    mutationFn: (payload: ConfirmPaymentIntentPayload) =>
      paymentService.confirmPaymentIntent(payload),
  });
}

export function useMyRefunds() {
  return useQuery({
    queryKey: paymentKeys.myRefunds,
    queryFn: () => paymentService.getMyRefunds(),
  });
}

/** Every matching payment: newest first unless an amount order is chosen. */
export function useAllPayments(
  query: Omit<GetPaymentsQuery, "page" | "limit"> = {},
) {
  return useQuery({
    queryKey: paymentKeys.all(query),
    queryFn: async () => {
      const payments = await fetchAllRows((page, limit) =>
        paymentService.getAllPayments({ ...query, page, limit }),
      );
      const direction = query.amount === "asc" ? 1 : -1;
      return payments.sort(
        (a, b) =>
          (query.amount ? (a.amount - b.amount) * direction : 0) ||
          byNewest(a, b),
      );
    },
  });
}

export function usePaymentById(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentService.getPaymentById(id),
    enabled: !!id,
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RefundPaymentPayload) => paymentService.refundPayment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useAllRefunds() {
  return useQuery({
    queryKey: paymentKeys.allRefunds,
    queryFn: () => paymentService.getAllRefunds(),
  });
}

export function useRefundById(id: string) {
  return useQuery({
    queryKey: paymentKeys.refund(id),
    queryFn: () => paymentService.getRefundById(id),
    enabled: !!id,
  });
}

export function useChangeRefundStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeRefundStatusPayload) => paymentService.changeRefundStatus(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["refunds"] }),
  });
}

export const cardKeys = {
  all: ["cards"] as const,
};

export function useCards() {
  return useQuery({
    queryKey: cardKeys.all,
    queryFn: () => cardService.getCards(),
    retry: 1,
  });
}

export function useAddCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCardPayload) => cardService.addCard(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

export function useSetDefaultCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetDefaultCardPayload) => cardService.setDefaultCard(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

export function useRemoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardService.removeCard(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardKeys.all }),
  });
}

// ── Driver payment hooks ────────────────────────────────────────────

export function useMyBalance() {
  return useQuery({
    queryKey: paymentKeys.driverBalance,
    queryFn: () => paymentService.getMyBalance(),
  });
}

export function useMyDriverPayments() {
  return useQuery({
    queryKey: paymentKeys.driverPayments,
    queryFn: () => paymentService.getMyDriverPayments(),
  });
}
