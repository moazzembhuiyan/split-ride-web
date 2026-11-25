"use client";

import {
  ArrowLeft01Icon,
  LockIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAddCard, useSetDefaultCard } from "@/hooks/booking/use-payment";
import { useMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { cardVisualType, formatCardBrand } from "@/lib/card";
import { getStripe, getStripePublishableKey } from "@/lib/stripe";

const elementStyle = {
  style: {
    base: {
      fontSize: "16px",
      fontFamily: "Outfit, system-ui, sans-serif",
      fontWeight: "500",
      color: "#1a1a1a",
      "::placeholder": { color: "#8b8b9a" },
    },
    invalid: { color: "#c2410c" },
  },
};

const stripeElementClass =
  "h-12 w-full rounded-3xl border border-transparent bg-input/50 px-4 py-3.5 transition-[box-shadow] focus-within:ring-3 focus-within:ring-ring/30";

function AddCardForm({ onBack }: { onBack: () => void }) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const { data: me } = useMe();
  const addCard = useAddCard();
  const setDefaultCard = useSetDefaultCard();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [numberComplete, setNumberComplete] = useState(false);
  const [expiryComplete, setExpiryComplete] = useState(false);
  const [cvcComplete, setCvcComplete] = useState(false);
  const [elementError, setElementError] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const profileName = me?.data?.name?.trim();
    if (profileName) setName((current) => current || profileName);
  }, [me]);

  const ready = Boolean(stripe && elements);
  const complete = numberComplete && expiryComplete && cvcComplete;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("profile.cards.nameRequired"));
      return;
    }
    if (!complete) {
      toast.error(t("profile.cards.incomplete"));
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      toast.error(t("profile.cards.addFailed"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: { name: trimmed },
      });

      if (result.error) {
        toast.error(result.error.message || t("profile.cards.addFailed"));
        return;
      }

      const paymentMethodId = result.paymentMethod.id;
      await addCard.mutateAsync({ paymentMethodId });
      if (makeDefault) {
        try {
          await setDefaultCard.mutateAsync({ paymentMethodId });
        } catch {
          // Card is saved even if default assignment fails.
        }
      }
      toast.success(t("profile.cards.added"));
      onBack();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("profile.cards.addFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 h-full w-full overflow-y-auto space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="cursor-pointer">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        </button>
        <h1 className="text-2xl font-bold">{t("profile.cards.addTitle")}</h1>
      </div>

      <div className="flex justify-center">
        <CreditCard
          type={cardVisualType(brand)}
          brand={brand}
          company={formatCardBrand(brand || undefined)}
          cardHolder={name.trim() || t("profile.cards.cardholderPlaceholder")}
          cardNumber="•••• •••• •••• ••••"
          cardExpiration="MM/YY"
        />
      </div>

      <p className="text-sm text-muted-foreground text-center">
        {t("profile.cards.addHint")}
      </p>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="cardholder">
              {t("profile.cards.cardholder")}
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={UserIcon} />
              </InputGroupAddon>
              <InputGroupInput
                id="cardholder"
                autoComplete="cc-name"
                placeholder={t("profile.cards.cardholderPlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("profile.cards.cardNumber")}</FieldLabel>
            <div className={stripeElementClass}>
              <CardNumberElement
                options={{ ...elementStyle, showIcon: true, disableLink: true }}
                onChange={(event) => {
                  setBrand(event.brand === "unknown" ? "" : event.brand);
                  setNumberComplete(event.complete);
                  setElementError(event.error?.message ?? "");
                }}
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>{t("profile.cards.expiry")}</FieldLabel>
              <div className={stripeElementClass}>
                <CardExpiryElement
                  options={elementStyle}
                  onChange={(event) => {
                    setExpiryComplete(event.complete);
                    setElementError(event.error?.message ?? "");
                  }}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel>{t("profile.cards.cvc")}</FieldLabel>
              <div className={stripeElementClass}>
                <CardCvcElement
                  options={elementStyle}
                  onChange={(event) => {
                    setCvcComplete(event.complete);
                    setElementError(event.error?.message ?? "");
                  }}
                />
              </div>
            </Field>
          </div>
        </FieldGroup>

        {elementError ? (
          <p className="text-sm text-destructive">{elementError}</p>
        ) : null}

        <div className="flex items-start gap-3">
          <Checkbox
            id="make-default-card"
            checked={makeDefault}
            onCheckedChange={(v) => setMakeDefault(v === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="make-default-card"
            className="flex flex-col gap-0.5 cursor-pointer"
          >
            <span className="text-sm font-medium">
              {t("profile.cards.setDefault")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("profile.cards.setDefaultHint")}
            </span>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!ready || submitting}
        >
          {submitting ? (
            <>
              <Spinner />
              {t("profile.cards.saving")}
            </>
          ) : (
            t("profile.cards.add")
          )}
        </Button>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={LockIcon} className="size-3.5" />
          {t("profile.cards.securedBy")}
        </p>
      </form>
    </div>
  );
}

export function AddCardView({ onBack }: { onBack: () => void }) {
  const t = useT();
  const stripePromise = getStripe();

  if (!getStripePublishableKey() || !stripePromise) {
    return (
      <div className="p-6 h-full w-full space-y-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="cursor-pointer">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </button>
          <h1 className="text-2xl font-bold">{t("profile.cards.addTitle")}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("profile.cards.stripeMissing")}
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <AddCardForm onBack={onBack} />
    </Elements>
  );
}
