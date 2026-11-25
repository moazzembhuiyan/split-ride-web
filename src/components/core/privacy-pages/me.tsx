"use client";
import {
  BirthdayCakeIcon,
  CallingIcon,
  Edit02Icon,
  GlobalIcon,
  ImageAdd02Icon,
  Location01Icon,
  MailIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUploadSingle } from "@/hooks/shared/use-upload";
import { useMe, useUpdateMe } from "@/hooks/shared/use-user";
import { LOCALE_NAMES, LOCALES, useT } from "@/i18n";
import { isMeaningfulAddress } from "@/lib/validate-address";

function DocumentUpload({
  id,
  label,
  initialSrc,
}: {
  id: string;
  label: string;
  initialSrc?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(initialSrc ?? null);

  useEffect(() => {
    if (!preview && initialSrc) setPreview(initialSrc);
  }, [initialSrc, preview]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <label htmlFor={id} className="cursor-pointer w-full block">
        <div className="relative aspect-video rounded-lg bg-accent w-full flex items-center justify-center hover:bg-accent-foreground/20 transition-colors overflow-hidden">
          {preview ? (
            <>
              <Image src={preview} alt={label} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <HugeiconsIcon
                  icon={Edit02Icon}
                  className="size-5 text-white"
                />
              </div>
            </>
          ) : (
            <HugeiconsIcon
              icon={ImageAdd02Icon}
              className="size-8 text-primary"
            />
          )}
        </div>
      </label>
      <input
        type="file"
        id={id}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export default function Me({ driver }: { driver?: boolean }) {
  const t = useT();
  const { data: meData, isLoading } = useMe();
  const user = meData?.data;

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [language, setLanguage] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updateMe = useUpdateMe();
  const uploadSingle = useUploadSingle();

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "");
      setAddress(user.address ?? "");
      setLanguage(user.language ?? "");
      if (user.latitude != null && user.longitude != null) {
        setCoords({ lat: user.latitude, lng: user.longitude });
      }
    }
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setPendingAvatarFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      address !== (user?.address ?? "") &&
      address.trim() &&
      !isMeaningfulAddress(address)
    ) {
      toast.error(t("profile.me.addressInvalid"));
      return;
    }
    try {
      let profileImage: string | undefined = user?.profileImage ?? undefined;
      if (pendingAvatarFile) {
        const res = await uploadSingle.mutateAsync(pendingAvatarFile);
        profileImage = res.data.url;
      }
      await updateMe.mutateAsync({
        name: name || undefined,
        profileImage,
        dateOfBirth: dateOfBirth || undefined,
        address: address.trim() || undefined,
        language: language || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      });
      toast.success(t("profile.me.updated"));
      setPendingAvatarFile(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("profile.me.failed"));
    }
  }

  const currentAvatar = avatarPreview ?? user?.profileImage ?? "/user.png";

  const isSaving = updateMe.isPending || uploadSingle.isPending;

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <h1 className="text-2xl font-bold">{t("profile.me.title")}</h1>

      {/* Avatar */}
      <div className="mt-8 w-min">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          className="relative size-36 rounded-full overflow-hidden bg-accent hover:opacity-90 transition-opacity cursor-pointer border-2 border-primary/20 focus:outline-none block"
        >
          <Image
            src={currentAvatar}
            alt={name || "avatar"}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <HugeiconsIcon icon={Edit02Icon} className="size-6 text-white" />
          </div>
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
          <Field>
            <FieldLabel>{t("common.fullName")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={UserIcon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("profile.me.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("profile.me.phoneNumber")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={CallingIcon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("profile.me.phonePlaceholder")}
                value={
                  user ? `${user.countryCode ?? ""}${user.phone ?? ""}` : ""
                }
                readOnly
                dir="ltr"
                className="opacity-60"
              />
            </InputGroup>
          </Field>

          <Field className="col-span-1 sm:col-span-2">
            <FieldLabel>{t("common.email")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={MailIcon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("common.email")}
                value={user?.email ?? ""}
                readOnly
                className="opacity-60"
              />
            </InputGroup>
          </Field>

          {driver && (
            <Field>
              <FieldLabel>{t("common.dateOfBirth")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={BirthdayCakeIcon} />
                </InputGroupAddon>
                <InputGroupInput
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  disabled={isLoading}
                />
              </InputGroup>
            </Field>
          )}

          {driver && (
            <Field>
              <FieldLabel>{t("common.address")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Location01Icon} />
                </InputGroupAddon>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onCoordinates={(lat, lng) => setCoords({ lat, lng })}
                  disabled={isLoading}
                />
              </InputGroup>
            </Field>
          )}

          <Field>
            <FieldLabel>{t("profile.me.language")}</FieldLabel>
            <Select
              value={language}
              onValueChange={setLanguage}
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 rounded-4xl border-0 bg-input/50 px-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HugeiconsIcon
                    icon={GlobalIcon}
                    className="size-4 text-primary"
                  />
                  <SelectValue placeholder={t("profile.me.selectLanguage")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {LOCALE_NAMES[code]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Driver-only documents */}
          {false && (
            <>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <FieldLabel>{t("profile.me.cnic")}</FieldLabel>
                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload
                    id="cnic-front"
                    label={t("profile.me.front")}
                    initialSrc={user?.documents?.[0]}
                  />
                  <DocumentUpload
                    id="cnic-back"
                    label={t("profile.me.back")}
                    initialSrc={user?.documents?.[1]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>{t("profile.me.carPapers")}</FieldLabel>
                <DocumentUpload
                  id="car-papers"
                  label={t("profile.me.document")}
                  initialSrc={user?.documents?.[4]}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>{t("profile.me.drivingLicense")}</FieldLabel>
                <div className="grid grid-cols-2 gap-4">
                  <DocumentUpload
                    id="dl-front"
                    label={t("profile.me.front")}
                    initialSrc={user?.documents?.[2]}
                  />
                  <DocumentUpload
                    id="dl-back"
                    label={t("profile.me.back")}
                    initialSrc={user?.documents?.[3]}
                  />
                </div>
              </div>
            </>
          )}

          <div className="col-span-1 sm:col-span-2 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("profile.me.saving") : t("profile.me.saveChanges")}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
