export type PaymentStatus = "pending" | "completed" | "refunded" | "paid" | "authorized";
export type RefundStatus = "pending" | "underReview" | "confirmed" | "rejected";
export type WithdrawStatus = "pending" | "completed" | "cancelled";

export interface PaymentUser {
  _id: string;
  name: string;
  profileImage?: string | null;
}

export interface Payment {
  _id: string;
  id: string;
  user: PaymentUser;
  provider: string;
  booking: string;
  method: string;
  transactionId: string;
  platformCommission: number;
  providerEarning: number;
  amount: number;
  status: PaymentStatus;
  paymentIntentId?: string;
  isPaid: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutPayload {
  booking: string;
  paymentMethodId: string;
}

export interface ConfirmPaymentPayload {
  sessionId: string;
  paymentId: string;
}

export interface ConfirmPaymentIntentPayload {
  paymentIntentId: string;
  paymentId: string;
}

export type CheckoutData =
  | string
  | Payment
  | {
      paymentIntentId?: string;
      paymentId?: string;
      clientSecret?: string;
      url?: string;
      isPaid?: boolean;
      status?: PaymentStatus;
    };

export interface RefundPaymentPayload {
  intendId: string;
  amount: number;
}

export interface Refund {
  _id: string;
  id: string;
  user: string;
  payment: string;
  booking: string;
  amount: number;
  status: RefundStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeRefundStatusPayload {
  status: RefundStatus;
  note?: string;
}

export interface GetPaymentsQuery {
  searchTerm?: string;
  amount?: "asc" | "desc";
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface Card {
  _id: string;
  id: string;
  user: string;
  paymentMethodId: string;
  type?: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  funding?: string;
  country?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddCardPayload {
  paymentMethodId: string;
}

export interface SetDefaultCardPayload {
  paymentMethodId: string;
}

// ── Driver payment types ────────────────────────────────────────────

export interface DriverBalance {
  availableBalance: number;
  totalEarnings: number;
  pendingAmount: number;
}

export interface DriverPayment {
  _id: string;
  id: string;
  user: PaymentUser;
  booking: string;
  amount: number;
  providerEarning: number;
  platformCommission: number;
  status: PaymentStatus;
  method: string;
  transactionId: string;
  createdAt: string;
}
