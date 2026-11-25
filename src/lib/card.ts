import type { Card } from "@/types/payment.types";

export function getCardPaymentMethodId(card: Card): string {
  return card.paymentMethodId || card.id;
}

export function getCardRecordId(card: Card): string {
  return card._id || card.id;
}

export function formatCardExpiry(month?: number, year?: number): string {
  if (!month || !year) return "";
  return `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
}

export function formatCardNumber(last4?: string): string {
  return last4 ? `•••• •••• •••• ${last4}` : "•••• •••• •••• ••••";
}

export function formatCardBrand(brand?: string): string {
  const key = (brand ?? "").trim().toLowerCase();
  if (!brand || !key || key === "unknown") return "CARD";
  if (key === "amex" || key === "american express") return "American Express";
  if (key === "mastercard") return "Mastercard";
  if (key === "diners") return "Diners Club";
  if (key === "unionpay") return "UnionPay";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function cardVisualType(brand?: string, isDefault?: boolean) {
  if (isDefault) return "brand-dark" as const;
  switch (brand?.toLowerCase()) {
    case "visa":
      return "brand-dark" as const;
    case "mastercard":
      return "gray-dark" as const;
    case "amex":
    case "american express":
      return "brand-light" as const;
    case "discover":
      return "salmon-strip" as const;
    default:
      return "gray-dark" as const;
  }
}
