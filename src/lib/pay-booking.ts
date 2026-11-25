import { isPaymentSecured } from "@/lib/is-booking-paid";
import { getStripe } from "@/lib/stripe";
import { ApiError } from "@/lib/api";
import {
  clearAuthorizedPayment,
  loadAuthorizedPayment,
  saveAuthorizedPayment,
} from "@/lib/pending-payment";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/types/payment.types";

export type ChargeResult = {
  status: "paid";
  payment: Payment;
  notifiedDrivers?: number;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asMongoId(value: unknown): string | undefined {
  const s = asString(value);
  if (!s) return undefined;
  return /^[a-f0-9]{24}$/i.test(s) ? s : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function intentIdFromSecret(secret: string | undefined): string | undefined {
  if (!secret) return undefined;
  const i = secret.indexOf("_secret_");
  if (i <= 0) return undefined;
  return secret.slice(0, i);
}

function asPayment(value: unknown): Payment | null {
  const obj = asRecord(value);
  if (!obj) return null;
  const mongoId = asMongoId(obj._id);
  const intent = asString(obj.paymentIntentId);
  const isPaymentDoc =
    !!mongoId &&
    typeof obj.status === "string" &&
    (intent?.startsWith("pi_") ||
      obj.method === "card" ||
      typeof obj.isPaid === "boolean");
  if (!isPaymentDoc) return null;
  return obj as unknown as Payment;
}

function walkRecords(value: unknown): Record<string, unknown>[] {
  const seen = new Set<Record<string, unknown>>();
  const out: Record<string, unknown>[] = [];
  const visit = (v: unknown, depth: number) => {
    const obj = asRecord(v);
    if (!obj || depth > 5 || seen.has(obj)) return;
    seen.add(obj);
    out.push(obj);
    visit(obj.data, depth + 1);
    visit(obj.payment, depth + 1);
  };
  visit(value, 0);
  return out;
}

function extractCheckout(
  value: unknown,
  bookingId: string,
): {
  payment: Payment | null;
  clientSecret?: string;
  paymentIntentId?: string;
  paymentId?: string;
} {
  const records = walkRecords(value);
  let payment: Payment | null = null;
  let clientSecret: string | undefined;
  let paymentIntentId: string | undefined;
  let paymentId: string | undefined;

  for (const obj of records) {
    payment ??= asPayment(obj);
    clientSecret ??=
      asString(obj.clientSecret) ??
      asString(obj.client_secret) ??
      asString(obj.stripeClientSecret);
    paymentIntentId ??=
      asString(obj.paymentIntentId) ?? asString(obj.payment_intent_id);
    const stripeId = asString(obj.id);
    if (stripeId?.startsWith("pi_")) paymentIntentId ??= stripeId;

    const explicit = asMongoId(obj.paymentId) ?? asMongoId(obj.payment_id);
    if (explicit && explicit !== bookingId) paymentId ??= explicit;

    const nestedPaymentId = asMongoId(asRecord(obj.payment)?._id);
    if (nestedPaymentId && nestedPaymentId !== bookingId) {
      paymentId ??= nestedPaymentId;
    }
  }

  const fromPayment = asMongoId(payment?._id);
  if (fromPayment && fromPayment !== bookingId) paymentId ??= fromPayment;

  paymentIntentId ??=
    asString(payment?.paymentIntentId) ?? intentIdFromSecret(clientSecret);

  return { payment, clientSecret, paymentIntentId, paymentId };
}

function unwrapConfirm(value: unknown): {
  ok: boolean;
  payment: Payment | null;
  notifiedDrivers?: number;
} {
  const records = walkRecords(value);
  const root = asRecord(value);
  const data = asRecord(root?.data) ?? root;
  const payment =
    asPayment(data?.payment) ??
    records.map(asPayment).find((item): item is Payment => item !== null) ??
    null;

  const successFlag = data?.success === true;
  const code = root?.code;
  const httpishOk = code === 200 || code === "200" || root?.status === true;
  const authorized = isPaymentSecured(payment);
  const message = `${asString(root?.message) ?? ""} ${asString(data?.message) ?? ""}`;
  const authorizedMessage = /authorized successfully|payment successful/i.test(
    message,
  );

  return {
    ok: successFlag || authorized || (httpishOk && authorizedMessage),
    payment,
    notifiedDrivers:
      typeof data?.notifiedDrivers === "number"
        ? data.notifiedDrivers
        : undefined,
  };
}

const STRIPE_AUTHORIZED = new Set([
  "requires_capture",
  "succeeded",
  "processing",
]);

function isAlreadyAuthorizedError(message: string, code?: string) {
  return /already been confirmed|already succeeded|unexpected_state|requires_capture/i.test(
    `${code ?? ""} ${message}`,
  );
}

async function confirmOnStripe(clientSecret: string, paymentMethodId: string) {
  const stripePromise = getStripe();
  if (!stripePromise) {
    throw new Error(
      "Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
    );
  }
  const stripe = await stripePromise;
  if (!stripe) throw new Error("Could not load Stripe.");

  const retrieved = await stripe.retrievePaymentIntent(clientSecret);
  if (retrieved.error) {
    throw new Error(retrieved.error.message || "Could not load payment.");
  }

  let status = retrieved.paymentIntent?.status;

  // Checkout uses capture_method: manual. If the PI is already authorized,
  // do not call confirm — Stripe rejects requires_capture confirms.
  if (status && STRIPE_AUTHORIZED.has(status)) return;

  if (status === "requires_action") {
    const next = await stripe.handleNextAction({ clientSecret });
    if (next.error) {
      throw new Error(next.error.message || "Card authentication failed.");
    }
    status = next.paymentIntent?.status as any;
    if (status && STRIPE_AUTHORIZED.has(status)) return;
  }

  if (status === "requires_confirmation" || status === "requires_payment_method") {
    let result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId,
    });
    if (result.error && /payment.?method/i.test(result.error.message ?? "")) {
      result = await stripe.confirmCardPayment(clientSecret);
    }
    if (result.error) {
      const msg = result.error.message || "Card authorization failed.";
      if (isAlreadyAuthorizedError(msg, result.error.code)) return;
      throw new Error(msg);
    }
    status = result.paymentIntent?.status;
  }

  if (status && !STRIPE_AUTHORIZED.has(status)) {
    throw new Error("Payment authorization was not completed.");
  }
}

/** False only when Stripe reports that the card is no longer held. */
async function isStillAuthorized(clientSecret?: string): Promise<boolean> {
  if (!clientSecret) return true;
  try {
    const stripe = await getStripe();
    const { paymentIntent } =
      (await stripe?.retrievePaymentIntent(clientSecret)) ?? {};
    return !paymentIntent || STRIPE_AUTHORIZED.has(paymentIntent.status);
  } catch {
    return true;
  }
}

const CONFIRM_RETRY_DELAYS_MS = [1000, 3000];

/** Confirming is safe to repeat; only lost or failed calls are retried. */
async function confirmWithRetry(ids: {
  paymentIntentId: string;
  paymentId: string;
}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await paymentService.confirmPaymentIntent(ids);
    } catch (error) {
      const refused =
        error instanceof ApiError && error.status >= 400 && error.status < 500;
      const delay = CONFIRM_RETRY_DELAYS_MS[attempt];
      if (refused || delay === undefined) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function confirmAuthorized(
  booking: string,
  ids: { paymentIntentId: string; paymentId: string; clientSecret?: string },
  known: Payment | null,
): Promise<ChargeResult> {
  let confirmed: Awaited<ReturnType<typeof confirmWithRetry>>;
  try {
    confirmed = await confirmWithRetry({
      paymentIntentId: ids.paymentIntentId,
      paymentId: ids.paymentId,
    });
  } catch (error) {
    if (!(await isStillAuthorized(ids.clientSecret))) {
      clearAuthorizedPayment(booking);
    }
    throw error;
  }
  const result = unwrapConfirm(confirmed);
  const data = asRecord(asRecord(confirmed)?.data);
  if (data?.success === false) {
    if (!(await isStillAuthorized(ids.clientSecret))) {
      clearAuthorizedPayment(booking);
    }
    throw new Error(
      asString(data.message) ||
        confirmed.message ||
        "Payment was not completed. Your booking was not confirmed.",
    );
  }
  clearAuthorizedPayment(booking);

  return {
    status: "paid",
    payment:
      result.payment ??
      known ??
      ({
        _id: ids.paymentId,
        paymentIntentId: ids.paymentIntentId,
        status: "authorized",
        isPaid: false,
      } as Payment),
    notifiedDrivers: result.notifiedDrivers,
  };
}

export async function chargeBooking(payload: {
  booking: string;
  paymentMethodId: string;
}): Promise<ChargeResult> {
  if (!payload.booking) throw new Error("Missing booking id.");
  if (!payload.paymentMethodId) throw new Error("Select a saved card to pay.");

  // The card is already authorised for this booking: only confirm it.
  const authorized = loadAuthorizedPayment(payload.booking);
  if (authorized) return confirmAuthorized(payload.booking, authorized, null);

  const checkoutRes = await paymentService.checkout({
    booking: payload.booking,
    paymentMethodId: payload.paymentMethodId,
  });
  const extracted = extractCheckout(checkoutRes, payload.booking);

  if (extracted.clientSecret) {
    await confirmOnStripe(extracted.clientSecret, payload.paymentMethodId);
  }

  const paymentIntentId = extracted.paymentIntentId;
  const paymentId = extracted.paymentId;
  if (!paymentIntentId || !paymentId) {
    throw new Error(
      checkoutRes.message ||
        "Checkout did not return paymentIntentId and paymentId.",
    );
  }

  const ids = {
    paymentIntentId,
    paymentId,
    clientSecret: extracted.clientSecret,
  };
  saveAuthorizedPayment(payload.booking, ids);
  return confirmAuthorized(payload.booking, ids, extracted.payment);
}
