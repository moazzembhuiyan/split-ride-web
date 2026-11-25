"use client";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { documentUrls, firstNonEmpty } from "@/lib/document-url";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useChangeUserStatus, useUserById } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { useChangeKycStatus, useKycById, useKycByUserId } from "@/hooks/driver/use-kyc";
import type { ChangeKycStatusPayload } from "@/types/driver.types";

/** The API accepts a rejection only with a reason of at least this length. */
const MIN_REASON_LENGTH = 10;

function DocThumb({ src, label }: { src?: string; label: string }) {
  const t = useT();
  const [failedSrc, setFailedSrc] = useState<string>();

  if (!src) {
    return (
      <div className="flex-1 rounded-xl border border-dashed h-[90px] flex items-center justify-center text-xs text-muted-foreground px-2 text-center">
        {t("admin.review.notUploaded", { label })}
      </div>
    );
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="flex-1 rounded-xl overflow-hidden border border-border bg-muted/30 h-[90px] relative cursor-zoom-in hover:opacity-90 flex items-center justify-center text-xs text-muted-foreground px-2 text-center"
    >
      {failedSrc === src ? (
        t("admin.review.openDocument")
      ) : (
        <Image
          src={src}
          alt={label}
          fill
          className="object-cover"
          unoptimized
          onError={() => setFailedSrc(src)}
        />
      )}
    </a>
  );
}

export default function Review({
  id,
  verified,
}: {
  id: string;
  verified: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const t = useT();
  const qc = useQueryClient();

  const { data, isPending } = useUserById(id, { enabled: open });
  const driver = data?.data;
  const kycId = driver?.provider?._id;
  const { data: kycData } = useKycById(kycId ?? "");
  const { data: kycByUser } = useKycByUserId(id, { enabled: open });

  const { mutate: changeStatus, isPending: isChanging } =
    useChangeUserStatus(id);
  const kycIdForPatch = kycId || kycData?.data?._id || kycByUser?.data?._id;

  const { mutate: changeKyc, isPending: isChangingKyc } = useChangeKycStatus(
    kycIdForPatch ?? "",
  );

  const initials = driver?.name
    ? driver.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  const defaultVehicle =
    driver?.vehicles?.find((v) => v.isDefault) ?? driver?.vehicles?.[0];

  const VEHICLE_INFO = [
    {
      label: t("admin.review.vehicleName"),
      value: defaultVehicle?.name ?? "—",
      highlight: true,
    },
    {
      label: t("admin.review.vehicleNumber"),
      value: defaultVehicle?.number ?? "—",
      highlight: false,
    },
    {
      label: t("admin.review.vehicleYear"),
      value: defaultVehicle?.year ?? "—",
      highlight: false,
    },
    {
      label: t("admin.review.vehicleSeats"),
      value: defaultVehicle?.seats ?? "—",
      highlight: false,
    },
    {
      label: t("admin.review.company"),
      value: driver?.provider?.companyName || "—",
      highlight: false,
    },
    {
      label: t("admin.bookings.vat"),
      value: driver?.provider?.vatNumber || "—",
      highlight: false,
    },
  ];

  const kyc = kycData?.data ?? kycByUser?.data;
  const docs = Array.isArray(driver?.documents) ? driver.documents : [];
  const cnicFront = firstNonEmpty(
    driver?.provider?.cnicFront,
    kyc?.cnicFront,
    typeof docs[0] === "string" ? docs[0] : undefined,
  );
  const cnicBack = firstNonEmpty(
    driver?.provider?.cnicBack,
    kyc?.cnicBack,
    typeof docs[1] === "string" ? docs[1] : undefined,
  );
  const licenseFront = firstNonEmpty(
    driver?.provider?.licenseFront,
    kyc?.licenseFront,
    typeof docs[2] === "string" ? docs[2] : undefined,
  );
  const licenseBack = firstNonEmpty(
    driver?.provider?.licenseBack,
    kyc?.licenseBack,
    typeof docs[3] === "string" ? docs[3] : undefined,
  );
  // Papers belong to the vehicle; older drivers have them on the KYC record.
  const vehiclePapers = documentUrls(defaultVehicle?.carPapers);
  const carPapers = [
    ...new Set(
      vehiclePapers.length > 0
        ? vehiclePapers
        : [
            ...documentUrls(driver?.provider?.carPapers),
            ...documentUrls(kyc?.carPapers),
            ...documentUrls(docs[4]),
          ],
    ),
  ];

  const kycStatus = kyc?.status ?? driver?.provider?.status;
  const canMoveToPending =
    !!kycIdForPatch && (verified || (!!kycStatus && kycStatus !== "pending"));
  const reasonTooShort = rejectReason.trim().length < MIN_REASON_LENGTH;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setRejecting(false);
      setRejectReason("");
    }
  };

  const submitKyc = (payload: ChangeKycStatusPayload) => {
    if (!kycIdForPatch) {
      toast.error(t("admin.review.noKyc"));
      return;
    }

    changeKyc(payload, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["user"] });
        qc.invalidateQueries({ queryKey: ["kyc"] });
        handleOpenChange(false);
      },
      onError: (err) =>
        toast.error(err.message || t("admin.review.kycFailed")),
    });
  };

  const handleVerify = () => submitKyc({ status: "verified" });

  const handlePending = () => submitKyc({ status: "pending" });

  const handleReject = () =>
    submitKyc({ status: "rejected", rejectionReason: rejectReason.trim() });

  const handleBlock = () => {
    changeStatus(
      { status: "blocked" },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["user"] });
          handleOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="px-6 h-10 bg-green-100 text-green-600 hover:bg-green-200"
          variant="secondary"
        >
          {t("admin.review.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:min-w-[660px] sm:max-w-[700px] p-0 overflow-hidden rounded-2xl">
        <div className="px-8 pt-8 pb-0">
          <DialogHeader className="text-center mb-5">
            <DialogTitle className="text-2xl font-bold">
              {t("admin.review.title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("admin.review.desc")}
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground">
                {t("admin.review.loading")}
              </span>
            </div>
          ) : !driver ? (
            <div className="text-center py-20 text-sm text-red-500">
              {t("admin.review.loadFailed")}
            </div>
          ) : (
            <>
              {/* Driver identity */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Avatar className="size-14 ring-2 ring-border">
                  <AvatarImage
                    src={driver?.profileImage ?? "/user.png"}
                    alt={driver?.name}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-lg font-semibold">{driver?.name}</span>
              </div>

              {/* Main body: docs + vehicle info */}
              <div className="flex gap-5">
                {/* Left: documents */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* CNIC */}
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      {t("admin.review.cnic")}
                    </p>
                    <div className="flex gap-3">
                      <DocThumb
                        src={cnicFront}
                        label={t("admin.review.idFront")}
                      />
                      <DocThumb
                        src={cnicBack}
                        label={t("admin.review.idBack")}
                      />
                    </div>
                  </div>

                  {/* Driving License + Car Papers */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2">
                        {t("admin.review.drivingLicense")}
                      </p>
                      <div className="flex gap-3">
                        <DocThumb
                          src={licenseFront}
                          label={t("admin.review.licenseFront")}
                        />
                        <DocThumb
                          src={licenseBack}
                          label={t("admin.review.licenseBack")}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2">
                        {t("admin.review.carPapers")}
                      </p>
                      <div className="flex flex-wrap gap-3 *:min-w-24">
                        {carPapers.length === 0 && (
                          <DocThumb label={t("admin.review.carPapers")} />
                        )}
                        {carPapers.map((src) => (
                          <DocThumb
                            key={src}
                            src={src}
                            label={t("admin.review.carPapers")}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: vehicle info card */}
                <div className="w-[220px] shrink-0 bg-blue-50 rounded-2xl p-4 flex flex-col gap-0 self-start">
                  {VEHICLE_INFO.map((item, i) => (
                    <div
                      key={item.label}
                      className={`flex items-center justify-between py-3 ${
                        i < VEHICLE_INFO.length - 1
                          ? "border-b border-blue-100"
                          : ""
                      }`}
                    >
                      <span className="text-sm text-slate-600 leading-tight">
                        {item.label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          item.highlight ? "text-blue-500" : "text-slate-800"
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        {!isPending && driver && rejecting && (
          <div className="px-8 py-6 mt-2 space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("admin.review.rejectReason")}
              aria-label={t("admin.review.rejectReason")}
              disabled={isChangingKyc}
            />
            {reasonTooShort && (
              <p className="text-xs text-muted-foreground">
                {t("admin.review.rejectReasonMin", {
                  count: MIN_REASON_LENGTH,
                })}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isChangingKyc}
                onClick={() => setRejecting(false)}
                className="flex-1 h-12 rounded-full border border-border font-semibold text-base hover:bg-muted transition-colors disabled:opacity-50"
              >
                {t("admin.help.cancel")}
              </button>
              <button
                type="button"
                disabled={isChangingKyc || reasonTooShort}
                onClick={handleReject}
                className="flex-1 h-12 rounded-full bg-red-500 text-white font-semibold text-base hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isChangingKyc
                  ? t("admin.common.processing")
                  : t("admin.review.confirmReject")}
              </button>
            </div>
          </div>
        )}
        {!isPending && driver && !rejecting && (
          <div className="flex gap-3 px-8 py-6 mt-2">
            {!verified && (
              <button
                type="button"
                disabled={isChanging || isChangingKyc}
                onClick={handleVerify}
                className="flex-1 h-12 rounded-full bg-linear-to-r from-cyan-400 to-violet-500 text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isChanging ? t("admin.common.processing") : t("admin.common.verify")}
              </button>
            )}
            {canMoveToPending && (
              <button
                type="button"
                disabled={isChanging || isChangingKyc}
                onClick={handlePending}
                className="flex-1 h-12 rounded-full bg-blue-50 text-blue-600 font-semibold text-base border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {t("admin.review.moveToPending")}
              </button>
            )}
            <button
              type="button"
              disabled={isChanging || isChangingKyc}
              onClick={() => setRejecting(true)}
              className="flex-1 h-12 rounded-full bg-amber-50 text-amber-600 font-semibold text-base border border-amber-100 hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {t("admin.review.reject")}
            </button>
            <button
              type="button"
              disabled={isChanging || isChangingKyc}
              onClick={handleBlock}
              className="flex-1 h-12 rounded-full bg-red-50 text-red-500 font-semibold text-base border border-red-100 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isChanging ? t("admin.common.processing") : t("admin.common.block")}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
