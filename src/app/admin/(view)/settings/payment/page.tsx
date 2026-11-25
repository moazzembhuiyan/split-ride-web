"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/i18n";

const PAYMENT_METHODS = [
  { id: "google-pay", label: "Google Pay", defaultEnabled: false },
  { id: "stripe", label: "Stripe", defaultEnabled: true },
  { id: "card", label: "Card", defaultEnabled: true },
];

export default function PaymentPage() {
  const t = useT();
  const [methods, setMethods] = useState<Record<string, boolean>>(
    Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.defaultEnabled])),
  );

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">{t("admin.settings.payment.title")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {t("admin.settings.payment.desc")}
      </p>

      <div className="mt-8 space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <Card key={method.id} className="py-0">
            <CardContent className="flex items-center justify-between py-5">
              <span className="font-medium text-sm">{method.label}</span>
              <Switch
                checked={methods[method.id]}
                onCheckedChange={({ checked }) =>
                  setMethods((prev) => ({
                    ...prev,
                    [method.id]: checked === true,
                  }))
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button>{t("admin.common.saveChanges")}</Button>
      </div>
    </div>
  );
}
