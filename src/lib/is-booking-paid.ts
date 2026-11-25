const SECURED_STATUSES = new Set(["paid", "completed", "authorized"]);

export function isBookingPaid(status: string | null | undefined): boolean {
  if (!status) return false;
  return SECURED_STATUSES.has(status.toLowerCase());
}

const UNPAID_STATUSES = new Set(["", "pending", "unpaid", "failed"]);

/** Never paid for. Refunded and cancelled payments do not count. */
export function isBookingUnpaid(status: string | null | undefined): boolean {
  return UNPAID_STATUSES.has((status ?? "").toLowerCase());
}

export function isPaymentSecured(
  payment: { status?: string; isPaid?: boolean } | null | undefined,
): boolean {
  if (!payment) return false;
  if (isBookingPaid(payment.status)) return true;
  return payment.isPaid === true;
}
