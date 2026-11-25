"use client";

import { useEffect, useState } from "react";
import {
  matchesFilter,
  needsAttention,
  type OrderFacts,
  type OrderKind,
  type OrderSort,
  parsePrice,
  sortOrders,
} from "@/lib/driver-orders";

/** Current time, refreshed every 30 seconds. */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** Sorts and filters a driver's orders; starts with the closest day. */
export function useOrderList<T>(
  items: readonly T[],
  read: (item: T) => OrderFacts,
  kind: OrderKind,
  now: number,
) {
  const [sort, setSort] = useState<OrderSort>("closest");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");

  const minPrice = parsePrice(minText);
  const maxPrice = parsePrice(maxText);
  const facts = items.map(read);
  const visible = sortOrders(
    items.filter((_, i) =>
      matchesFilter(facts[i], { attentionOnly, minPrice, maxPrice }, now),
    ),
    read,
    sort,
    kind,
    now,
  );

  return {
    visible,
    controls: {
      kind,
      sort,
      setSort,
      attentionOnly,
      setAttentionOnly,
      minText,
      setMinText,
      maxText,
      setMaxText,
      invalidMin: minText.trim() !== "" && minPrice === null,
      invalidMax:
        (maxText.trim() !== "" && maxPrice === null) ||
        (minPrice !== null && maxPrice !== null && minPrice > maxPrice),
      hasPrice: facts.some((f) => f.price !== null),
      attentionCount: facts.filter((f) => needsAttention(f, now)).length,
      isFiltered: attentionOnly || minText !== "" || maxText !== "",
      clear: () => {
        setAttentionOnly(false);
        setMinText("");
        setMaxText("");
      },
      shown: visible.length,
      total: items.length,
    },
  };
}

export type OrderListControls = ReturnType<typeof useOrderList>["controls"];
