"use client";

import { useT } from "@/i18n";
import Rings from "@/components/core/rings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Location01Icon,
  Navigation03Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { XIcon } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const t = useT();
  const [agreed, setAgreed] = React.useState(false);
  return (
    <div className="p-12 grid grid-cols-4 gap-12 items-start">
      <div className="col-span-3 ">
        <div className="flex items-stretch gap-4 p-6 bg-secondary rounded-xl">
          {/* Icons + connector */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <HugeiconsIcon className="size-4" icon={Navigation03Icon} />
            </div>
            <div className="flex-1 w-0 border-l-2 border-dashed border-muted-foreground/40 my-1" />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <HugeiconsIcon className="size-4" icon={Location01Icon} />
            </div>
          </div>

          {/* Addresses */}
          <div className="flex flex-col justify-between flex-1 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                1901 Thornridge Cir. Shiloh
              </span>
              <button
                type="button"
                className="text-sm text-violet-500 hover:text-violet-600 font-medium shrink-0 ml-4"
              >
                {t("book.confirm.change")}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                4140 Parker Rd. Allentown, New Mexico
              </span>
              <button
                type="button"
                className="text-sm text-violet-500 hover:text-violet-600 font-medium shrink-0 ml-4"
              >
                {t("book.confirm.change")}
              </button>
            </div>
          </div>
        </div>
        <Card className="py-6 bg-secondary rounded-xl mt-6">
          <CardHeader>
            <CardTitle>{t("book.confirm.paymentTitle")}</CardTitle>
          </CardHeader>
          <CardContent>Stripe integration will be added here</CardContent>
          <CardContent>
            <div className="">
              <FieldGroup className="flex flex-row items-center space-x-2 gap-0!">
                <Checkbox
                  className="bg-transparent! border-primary text-primary p-2"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(!!v)}
                />
                <FieldLabel className="inline-block text-sm text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </FieldLabel>
              </FieldGroup>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("book.confirm.dataUsage")}{" "}
              <Link href="/terms" className="text-primary hover:underline">
                {t("book.confirm.termsLink")}
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="col-span-1 bg-secondary border-0 ring-0">
        <CardHeader>
          <CardTitle className="text-lg text-center font-bold ">
            {t("book.confirm.overview")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white mx-4 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.approxPrice")}</span>
            <span className="text-transparent font-bold bg-clip-text bg-linear-to-r from-blue-500 to-purple-500">
              $60
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.carType")}</span>
            <span className="font-semibold">Sadan (4 Seater)</span>
          </div>
          <div className="space-y-2">
            <div>{t("book.confirm.luggageInfo")}</div>
            <div className="space-x-1 space-y-1">
              <Badge>
                Suitcase{" "}
                <Button variant="ghost" size="icon" className="p-0! size-auto">
                  <XIcon />
                </Button>
              </Badge>
              <Badge>
                Hand carry{" "}
                <Button variant="ghost" size="icon" className="p-0! size-auto">
                  <XIcon />
                </Button>
              </Badge>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.pickupDate")}</span>
            <span className="font-semibold">25 May, 2025</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.pickupTime")}</span>
            <span className="font-semibold">10 Min</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.carSeats")}</span>
            <span className="font-semibold">4</span>
          </div>
        </CardContent>
        <CardContent className="space-y-4 bg-white mx-4 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span>{t("book.confirm.yourPickupTime")}</span>
            <span className="font-semibold">10:30 PM</span>
          </div>
        </CardContent>
        <CardFooter className="w-full flex-col space-y-4">
          <div className="flex justify-between items-center w-full">
            <span>{t("book.confirm.vat")}</span>
            <span className="text-primary font-semibold">$3.50</span>
          </div>
          <div className="flex justify-between items-center w-full">
            <span>{t("book.confirm.totalAmount")}</span>
            <span className="text-primary font-black text-xl">$60</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="destructive" className="">
              {t("common.cancel")}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full col-span-2" disabled={!agreed}>
                  {t("book.confirm.confirmPay")}
                </Button>
              </DialogTrigger>
              <DialogContent className="gap-4" showCloseButton={false}>
                <DialogHeader className="text-center hidden">
                  <DialogTitle>{t("auth.login.otpTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("auth.login.otpDesc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center gap-4 w-full">
                  <div className="size-24 bg-linear-to-r from-cyan-400 to-violet-500 rounded-full flex justify-center items-center">
                    <HugeiconsIcon
                      icon={Tick01Icon}
                      className="size-18 text-background"
                    />
                  </div>
                  <h2 className="text-2xl font-bold">
                    {t("book.confirm.bookedTitle")}
                  </h2>
                  <p className="text-muted-foreground">
                    {t("book.confirm.bookedMsg")}
                  </p>
                  <p className="text-center">
                    {t("common.bookingId")}:{" "}
                    <span className="font-bold text-primary">SR1284E6</span>
                  </p>
                  <Button className="w-full" asChild>
                    <Link href="/my-rides">
                      {t("book.confirm.viewBooking")}
                    </Link>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="">
            <h2 className="text-base font-semibold">
              {t("book.confirm.disclaimer")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("book.confirm.disclaimerText")}
            </p>
          </div>
        </CardFooter>
      </Card>
      <Rings />
    </div>
  );
}
