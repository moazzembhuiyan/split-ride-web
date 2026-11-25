"use client";
import {
  BirthdayCakeIcon,
  Calendar01Icon,
  Car01Icon,
  ImageAdd02Icon,
  LayoutGridIcon,
  LicenseIcon,
  Location01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Rings from "@/components/core/rings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useSetupKyc } from "@/hooks/driver/use-kyc";
import { useAddMultipleVehicles } from "@/hooks/driver/use-vehicle";
import { useUploadMultiple, useUploadSingle } from "@/hooks/shared/use-upload";
import { useUpdateMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { isMeaningfulAddress } from "@/lib/validate-address";

type Vehicle = {
  id: string;
  model: string;
  number: string;
  year: string;
  seats: string;
};

function UploadBox({
  label,
  file,
  onChange,
  className,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-center hover:bg-primary/10 transition-colors ${className ?? ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <>
          <span className="text-xs font-medium text-primary truncate w-full text-center leading-tight">
            {file.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </>
      ) : (
        <>
          <span className="text-2xl font-light text-primary leading-none">
            +
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {label}
          </span>
        </>
      )}
    </button>
  );
}

function newVehicle(): Vehicle {
  return {
    id: crypto.randomUUID(),
    model: "",
    number: "",
    year: "",
    seats: "",
  };
}

export default function Page() {
  const t = useT();
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([newVehicle()]);
  const [avatar, setAvatar] = useState<File | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [iban, setIban] = useState("");
  const [driverType, setDriverType] = useState<"self-employed" | "company">(
    "self-employed",
  );
  const [companyName, setCompanyName] = useState("");
  const [companyReg, setCompanyReg] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [cnicFront, setCnicFront] = useState<File | null>(null);
  const [cnicBack, setCnicBack] = useState<File | null>(null);
  const [dlFront, setDlFront] = useState<File | null>(null);
  const [dlBack, setDlBack] = useState<File | null>(null);
  const [carPapers, setCarPapers] = useState<File | null>(null);

  const uploadSingle = useUploadSingle();
  const uploadMultiple = useUploadMultiple();
  const updateMe = useUpdateMe();
  const setupKyc = useSetupKyc();
  const addMultipleVehicles = useAddMultipleVehicles();

  function updateVehicle(index: number, field: keyof Vehicle, value: string) {
    setVehicles((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    );
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, newVehicle()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (!iban.trim()) {
      toast.error("IBAN is required");
      setSubmitting(false);
      return;
    }

    if (address.trim() && !isMeaningfulAddress(address)) {
      toast.error(t("profile.me.addressInvalid"));
      setSubmitting(false);
      return;
    }

    try {
      let profileImageUrl: string | undefined;
      if (avatar) {
        const res = await uploadSingle.mutateAsync(avatar);
        profileImageUrl = res.data.url;
      }

      const kycFileEntries = (
        [
          ["cnicFront", cnicFront],
          ["cnicBack", cnicBack],
          ["dlFront", dlFront],
          ["dlBack", dlBack],
          ["carPapers", carPapers],
        ] as Array<[string, File | null]>
      ).filter(([, f]) => f !== null) as Array<[string, File]>;

      const kycUrls: Record<string, string> = {};
      if (kycFileEntries.length > 0) {
        const res = await uploadMultiple.mutateAsync(
          kycFileEntries.map(([, f]) => f),
        );
        res.data.forEach(({ url }, i) => {
          kycUrls[kycFileEntries[i][0]] = url;
        });
      }

      await updateMe.mutateAsync({
        ...(dob ? { dateOfBirth: dob } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(profileImageUrl ? { profileImage: profileImageUrl } : {}),
        type: driverType,
      });

      await setupKyc.mutateAsync({
        ibanNumber: iban.trim(),
        ...(driverType === "company"
          ? {
              ...(companyName ? { companyName } : {}),
              ...(companyReg ? { companyReg } : {}),
              ...(vatNumber ? { vatNumber } : {}),
            }
          : {}),
        ...(kycUrls.cnicFront ? { cnicFront: kycUrls.cnicFront } : {}),
        ...(kycUrls.cnicBack ? { cnicBack: kycUrls.cnicBack } : {}),
        ...(kycUrls.dlFront ? { licenseFront: kycUrls.dlFront } : {}),
        ...(kycUrls.dlBack ? { licenseBack: kycUrls.dlBack } : {}),
        ...(kycUrls.carPapers ? { carPapers: [kycUrls.carPapers] } : {}),
      });

      const validVehicles = vehicles
        .filter((v) => v.model && v.number && v.year && v.seats)
        .map((v) => ({
          name: v.model,
          number: v.number,
          year: Number(v.year),
          seats: Number(v.seats) as 4 | 6,
        }));

      if (validVehicles.length > 0) {
        await addMultipleVehicles.mutateAsync(validVehicles);
      }

      setDialogOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen w-full relative overflow-hidden flex flex-col items-center py-10 px-6">
      <Rings />

      {/* Top-right rings */}
      <div className="pointer-events-none absolute -right-48 z-10 -top-48 size-96 rounded-full p-15 bg-linear-to-br from-cyan-400/80 to-violet-500 xl:-right-60 xl:-top-60 xl:size-120 xl:p-20 2xl:-right-75 2xl:-top-75 2xl:size-150 2xl:p-25">
        <div className="w-full h-full rounded-full bg-background" />
      </div>
      <div className="pointer-events-none absolute -right-24 z-0 -top-56 size-96 rounded-full p-15 bg-linear-to-br from-cyan-400/30 to-violet-500/30 xl:-right-32 xl:-top-72 xl:size-120 xl:p-20 2xl:-right-40 2xl:-top-90 2xl:size-150 2xl:p-25">
        <div className="w-full h-full rounded-full bg-background" />
      </div>

      <Image
        src="/logo.webp"
        alt="Split Ride"
        width={600}
        height={200}
        className="w-48 mb-2 z-10"
      />

      <div className="text-center mb-8 z-10">
        <h1 className="text-2xl font-bold">{t("auth.info.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("auth.info.subtitle")}
        </p>
      </div>

      {/* Avatar */}
      <div className="mb-8 z-10">
        <input
          ref={avatarRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className="size-24 rounded-full bg-primary/10 flex flex-col items-center justify-center gap-1 hover:bg-primary/20 transition-colors overflow-hidden"
        >
          {avatar ? (
            <span className="text-[10px] text-primary px-1 text-center leading-tight truncate w-full">
              {avatar.name}
            </span>
          ) : (
            <HugeiconsIcon
              icon={ImageAdd02Icon}
              className="size-9 text-primary"
            />
          )}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-5xl z-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field>
            <FieldLabel>Driver type</FieldLabel>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={driverType === "self-employed" ? "default" : "outline"}
                onClick={() => setDriverType("self-employed")}
              >
                Self-employed
              </Button>
              <Button
                type="button"
                variant={driverType === "company" ? "default" : "outline"}
                onClick={() => setDriverType("company")}
              >
                Company
              </Button>
            </div>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>IBAN</FieldLabel>
            <InputGroup>
              <InputGroupInput
                placeholder="CY17 ACCT-000002 00527600"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                required
              />
            </InputGroup>
          </Field>
        </div>
        {driverType === "company" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>Company name</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>Company registration</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  value={companyReg}
                  onChange={(e) => setCompanyReg(e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel>VAT number</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                />
              </InputGroup>
            </Field>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field>
            <FieldLabel>{t("common.dateOfBirth")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={BirthdayCakeIcon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("auth.info.dobPlaceholder")}
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </InputGroup>
          </Field>
          <Field className="sm:col-span-2">
            <FieldLabel>{t("common.address")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Location01Icon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("auth.info.addressPlaceholder")}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </InputGroup>
          </Field>
        </div>

        {vehicles.map((vehicle, index) => (
          <div key={vehicle.id}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">
                Vehicle {vehicles.length > 1 ? index + 1 : ""}
              </h2>
              {index === vehicles.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-5 font-semibold"
                  onClick={addVehicle}
                >
                  {t("auth.info.addVehicle")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Car01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.info.vehicleModel")}
                  value={vehicle.model}
                  onChange={(e) =>
                    updateVehicle(index, "model", e.target.value)
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={LicenseIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.info.vehicleNumber")}
                  value={vehicle.number}
                  onChange={(e) =>
                    updateVehicle(index, "number", e.target.value)
                  }
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Calendar01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.info.mfgYear")}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={vehicle.year}
                  onChange={(e) => updateVehicle(index, "year", e.target.value)}
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={LayoutGridIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("auth.info.seats")}
                  type="number"
                  min="1"
                  value={vehicle.seats}
                  onChange={(e) =>
                    updateVehicle(index, "seats", e.target.value)
                  }
                />
              </InputGroup>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="font-medium mb-3">{t("auth.info.uploadCnic")}</p>
            <div className="grid grid-cols-2 gap-3">
              <UploadBox
                label={t("auth.info.cnicFront")}
                file={cnicFront}
                onChange={setCnicFront}
                className="h-28"
              />
              <UploadBox
                label={t("auth.info.cnicBack")}
                file={cnicBack}
                onChange={setCnicBack}
                className="h-28"
              />
            </div>
          </div>
          <div>
            <p className="font-medium mb-3">{t("auth.info.uploadDl")}</p>
            <div className="grid grid-cols-2 gap-3">
              <UploadBox
                label={t("auth.info.dlFront")}
                file={dlFront}
                onChange={setDlFront}
                className="h-28"
              />
              <UploadBox
                label={t("auth.info.dlBack")}
                file={dlBack}
                onChange={setDlBack}
                className="h-28"
              />
            </div>
          </div>
          <div>
            <p className="font-medium mb-3">{t("auth.info.uploadCar")}</p>
            <UploadBox
              label={t("auth.info.carPapers")}
              file={carPapers}
              onChange={setCarPapers}
              className="h-28 w-full"
            />
          </div>
        </div>

        <div className="flex justify-center pb-4">
          <Button type="submit" className="w-64" disabled={submitting}>
            {submitting ? "Submitting..." : t("auth.info.submit")}
          </Button>
        </div>
      </form>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader className="text-center hidden">
            <DialogTitle>{t("auth.register.otpTitle")}</DialogTitle>
            <DialogDescription>
              {t("auth.register.otpDesc")}
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
              {t("auth.info.receivedTitle")}
            </h2>
            <p className="text-muted-foreground text-center">
              {t("auth.info.receivedMsg")}
            </p>
            <Button className="w-full" asChild>
              <Link href={"/driver"}>{t("auth.info.goHome")}</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
