import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse, Paginator } from "@/types/base";
import type {
  AddCardPayload,
  Card,
  ChangeRefundStatusPayload,
  CheckoutData,
  CheckoutPayload,
  ConfirmPaymentIntentPayload,
  ConfirmPaymentPayload,
  DriverBalance,
  DriverPayment,
  GetPaymentsQuery,
  Payment,
  Refund,
  RefundPaymentPayload,
  SetDefaultCardPayload,
} from "@/types/payment.types";

export const paymentService = {
  checkout: (payload: CheckoutPayload) =>
    howl<ApiResponse<CheckoutData>>("/payments/checkout", {
      method: "POST",
      body: payload,
    }),

  confirmPayment: (params: ConfirmPaymentPayload) => {
    const qs = new URLSearchParams({
      sessionId: params.sessionId,
      paymentId: params.paymentId,
    }).toString();
    return howl<ApiResponse<Payment>>(`/payments/confirm-payment?${qs}`);
  },

  confirmPaymentIntent: (payload: ConfirmPaymentIntentPayload) =>
    howl<ApiResponse<Payment>>("/payments/confirm-payment", {
      method: "POST",
      body: payload,
    }),

  getMyRefunds: () =>
    howl<ApiResponse<Refund[]>>("/refunds/my-refund"),

  // Driver
  getMyBalance: () =>
    howl<ApiResponse<DriverBalance>>("/payments/driver/balance"),

  getMyDriverPayments: () =>
    howl<ApiResponse<DriverPayment[]>>("/payments/driver/payments"),

  // Admin
  getAllPayments: (query?: GetPaymentsQuery) => {
    const params = new URLSearchParams();
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    if (query?.amount) params.set("amount", query.amount);
    if (query?.minAmount != null) params.set("minAmount", String(query.minAmount));
    if (query?.maxAmount != null) params.set("maxAmount", String(query.maxAmount));
    if (query?.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query?.dateTo) params.set("dateTo", query.dateTo);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return howl<PagedResponse<Payment>>(`/payments${qs ? `?${qs}` : ""}`);
  },

  getPaymentById: (id: string) =>
    howl<ApiResponse<Payment>>(`/payments/${id}`),

  refundPayment: (payload: RefundPaymentPayload) =>
    howl<ApiResponse<Refund>>("/payments/refound-payment", { method: "PATCH", body: payload }),

  getAllRefunds: () =>
    howl<ApiResponse<Paginator<Refund[]>>>("/refunds"),

  getRefundById: (id: string) =>
    howl<ApiResponse<Refund>>(`/refunds/${id}`),

  changeRefundStatus: (id: string, payload: ChangeRefundStatusPayload) =>
    howl<ApiResponse<Refund>>(`/refunds/status/${id}`, { method: "PATCH", body: payload }),

  deleteRefund: (id: string) =>
    howl<ApiResponse<null>>(`/refunds/${id}`, { method: "DELETE" }),
};

export const cardService = {
  addCard: (payload: AddCardPayload) =>
    howl<ApiResponse<Card>>("/cards", { method: "POST", body: payload }),

  getCards: () =>
    howl<ApiResponse<Card[]>>("/cards/list"),

  setDefaultCard: (payload: SetDefaultCardPayload) =>
    howl<ApiResponse<Card>>("/cards/set-default", { method: "POST", body: payload }),

  removeCard: (id: string) =>
    howl<ApiResponse<null>>(`/cards/${id}`, { method: "DELETE" }),
};
