"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderListControls } from "@/hooks/driver/use-order-list";
import { useI18n, useT } from "@/i18n";
import {
  dayLabel,
  daysUntilPickup,
  isOverdue,
  needsAttention,
  ORDER_SORTS,
  type OrderFacts,
  type OrderSort,
} from "@/lib/driver-orders";
import { cn } from "@/lib/utils";

export function OrderToolbar({
  controls: c,
  className,
}: {
  controls: OrderListControls;
  className?: string;
}) {
  const t = useT();
  const sorts = ORDER_SORTS.filter((s) => c.hasPrice || !s.startsWith("price"));

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={c.sort} onValueChange={(v) => c.setSort(v as OrderSort)}>
        <SelectTrigger size="sm" aria-label={t("driver.sort.label")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {sorts.map((s) => (
            <SelectItem key={s} value={s}>
              {t(`driver.sort.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {c.kind === "open" && (
        <Button
          type="button"
          size="sm"
          variant={c.attentionOnly ? "default" : "outline"}
          aria-pressed={c.attentionOnly}
          className="rounded-full"
          onClick={() => c.setAttentionOnly(!c.attentionOnly)}
        >
          {t("driver.filter.attention")} ({c.attentionCount})
        </Button>
      )}

      {c.hasPrice && (
        <div className="flex items-center gap-1">
          <Input
            inputMode="decimal"
            className="h-8 w-24 px-3 text-sm"
            placeholder={t("driver.filter.minPrice")}
            aria-label={t("driver.filter.minPrice")}
            aria-invalid={c.invalidMin}
            value={c.minText}
            onChange={(e) => c.setMinText(e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            inputMode="decimal"
            className="h-8 w-24 px-3 text-sm"
            placeholder={t("driver.filter.maxPrice")}
            aria-label={t("driver.filter.maxPrice")}
            aria-invalid={c.invalidMax}
            value={c.maxText}
            onChange={(e) => c.setMaxText(e.target.value)}
          />
        </div>
      )}

      {c.isFiltered && (
        <>
          <span
            className="text-xs text-muted-foreground tabular-nums"
            aria-live="polite"
          >
            {c.shown} / {c.total}
          </span>
          <Button type="button" size="sm" variant="ghost" onClick={c.clear}>
            {t("driver.filter.clear")}
          </Button>
        </>
      )}
    </div>
  );
}

/** Shown instead of the list when the filters hide every order. */
export function NoMatchingOrders() {
  const t = useT();
  return (
    <p className="py-12 w-full text-center text-sm text-muted-foreground">
      {t("driver.filter.none")}
    </p>
  );
}

/** How close an open order is: overdue, today, tomorrow, in 4 days. */
export function PickupBadge({
  order,
  now,
}: {
  order: OrderFacts;
  now: number;
}) {
  const t = useT();
  const { locale } = useI18n();
  if (isOverdue(order, now)) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200">
        {t("driver.overdue")}
      </Badge>
    );
  }
  const days = daysUntilPickup(order, now);
  if (days === null) return null;
  return needsAttention(order, now) ? (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
      {dayLabel(days, locale)}
    </Badge>
  ) : (
    <Badge variant="outline">{dayLabel(days, locale)}</Badge>
  );
}
