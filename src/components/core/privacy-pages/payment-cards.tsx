"use client";

import {
  CreditCardIcon,
  Delete02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";
import { AddCardView } from "@/components/core/privacy-pages/add-card-form";
import { CreditCard } from "@/components/shared-assets/credit-card/credit-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useCards,
  useRemoveCard,
  useSetDefaultCard,
} from "@/hooks/booking/use-payment";
import { useT } from "@/i18n";
import {
  cardVisualType,
  formatCardBrand,
  formatCardExpiry,
  formatCardNumber,
  getCardPaymentMethodId,
  getCardRecordId,
} from "@/lib/card";
import type { Card } from "@/types/payment.types";

const gradientBorderStyle: CSSProperties = {
  border: "2px solid transparent",
  backgroundImage:
    "linear-gradient(white, white), linear-gradient(to right, #06b6d4, #8b5cf6)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
  WebkitBackgroundClip: "padding-box, border-box",
};

const gradientTextStyle: CSSProperties = {
  backgroundImage: "linear-gradient(to right, #06b6d4, #8b5cf6)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

function SavedCard({
  card,
  busy,
  onMakeDefault,
  onRemove,
}: {
  card: Card;
  busy: boolean;
  onMakeDefault: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const brand = formatCardBrand(card.brand);
  const expiry = formatCardExpiry(card.expMonth, card.expYear);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[316px]">
      <div className="relative">
        <CreditCard
          type={"gray-dark"}
          brand={card.brand}
          company={brand}
          cardNumber={formatCardNumber(card.last4)}
          cardHolder={(card.funding ?? "").toUpperCase()}
          cardExpiration={expiry || "—"}
        />
        {card.isDefault && (
          <Badge className="absolute top-3 left-3 shadow-sm">
            {t("profile.cards.default")}
          </Badge>
        )}
      </div>

      <div className="flex w-full gap-2">
        {!card.isDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={onMakeDefault}
          >
            {busy ? <Spinner /> : <HugeiconsIcon icon={Tick02Icon} />}
            {t("profile.cards.makeDefault")}
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className={card.isDefault ? "w-full" : "flex-1"}
          disabled={busy}
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} />
          {t("profile.cards.remove")}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentCards({
  driver: _driver,
}: {
  driver?: boolean;
}) {
  const t = useT();
  const [view, setView] = useState<"list" | "add">("list");
  const [pendingDelete, setPendingDelete] = useState<Card | null>(null);
  const { data, isLoading, isError } = useCards();
  const setDefaultCard = useSetDefaultCard();
  const removeCard = useRemoveCard();

  const cards = data?.data ?? [];
  const busyId =
    setDefaultCard.isPending || removeCard.isPending
      ? setDefaultCard.variables
        ? setDefaultCard.variables.paymentMethodId
        : removeCard.variables
      : null;

  async function handleMakeDefault(card: Card) {
    try {
      await setDefaultCard.mutateAsync({
        paymentMethodId: getCardPaymentMethodId(card),
      });
      toast.success(t("profile.cards.defaultSet"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("profile.cards.defaultFailed"),
      );
    }
  }

  async function handleRemove() {
    if (!pendingDelete) return;
    try {
      await removeCard.mutateAsync(getCardRecordId(pendingDelete));
      toast.success(t("profile.cards.removed"));
      setPendingDelete(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("profile.cards.removeFailed"),
      );
    }
  }

  if (view === "add") {
    return <AddCardView onBack={() => setView("list")} />;
  }

  return (
    <div className="p-6 h-full w-full overflow-y-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("profile.cards.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("profile.cards.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView("add")}
          className="rounded-full px-6 py-2 font-semibold text-sm cursor-pointer shrink-0"
          style={gradientBorderStyle}
        >
          <span style={gradientTextStyle}>{t("profile.cards.add")}</span>
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 justify-items-center gap-6">
          <Skeleton className="h-[190px] w-full max-w-[316px] rounded-2xl" />
          <Skeleton className="h-[190px] w-full max-w-[316px] rounded-2xl" />
        </div>
      )}

      {!isLoading && isError && (
        <p className="text-sm text-destructive text-center py-8">
          {t("profile.cards.loadFailed")}
        </p>
      )}

      {!isLoading && !isError && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
            <HugeiconsIcon
              icon={CreditCardIcon}
              className="size-7 text-primary"
            />
          </div>
          <p className="font-semibold">{t("profile.cards.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            {t("profile.cards.emptyHint")}
          </p>
          <Button type="button" onClick={() => setView("add")}>
            {t("profile.cards.add")}
          </Button>
        </div>
      )}

      {!isLoading && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 justify-items-center gap-8">
          {cards.map((card) => {
            const id = getCardRecordId(card);
            const pmId = getCardPaymentMethodId(card);
            const busy = busyId === id || busyId === pmId;
            return (
              <SavedCard
                key={id}
                card={card}
                busy={busy}
                onMakeDefault={() => handleMakeDefault(card)}
                onRemove={() => setPendingDelete(card)}
              />
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("profile.cards.removeTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.isDefault
                ? t("profile.cards.removeDefaultMsg")
                : t("profile.cards.removeMsg")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeCard.isPending}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeCard.isPending}
              onClick={(e) => {
                e.preventDefault();
                void handleRemove();
              }}
            >
              {removeCard.isPending ? (
                <>
                  <Spinner />
                  {t("profile.cards.removing")}
                </>
              ) : (
                t("profile.cards.remove")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
