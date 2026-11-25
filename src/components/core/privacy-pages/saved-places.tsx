"use client";

import {
  Delete02Icon,
  Edit02Icon,
  Location01Icon,
  PinLocation01Icon,
  PinLocation02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AddressAutocomplete,
  type AddressData,
} from "@/components/ui/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  useCreateSavedPlace,
  useDeleteSavedPlace,
  usePinSavedPlace,
  useSavedPlaces,
  useUpdateSavedPlace,
} from "@/hooks/booking/use-save-place";
import { useT } from "@/i18n";
import type { GeoPoint, SavedPlace } from "@/types/save-place.types";

function toGeoPoint(lat: number, lng: number): GeoPoint {
  return { type: "Point", coordinates: [lng, lat] };
}

interface PlaceFormState {
  label: string;
  address: string;
  coords: { lat: number; lng: number } | null;
}

function PlaceDialog({
  open,
  onOpenChange,
  initial,
  placeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: PlaceFormState;
  placeId?: string;
}) {
  const t = useT();
  const isEdit = !!placeId;
  const [label, setLabel] = useState(initial?.label ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.coords ?? null,
  );
  const [streetName, setStreetName] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [zip, setZip] = useState("");

  function handleAddressData(data: AddressData) {
    setCoords({ lat: data.lat, lng: data.lng });
    setStreetName(data.streetName);
    setStreetNumber(data.streetNumber);
    setDistrict(data.district);
    setMunicipality(data.municipality);
    setZip(data.zip);
  }

  const create = useCreateSavedPlace();
  const update = useUpdateSavedPlace(placeId ?? "");
  const isPending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error(t("profile.savedPlaces.labelRequired"));
      return;
    }
    if (!coords) {
      toast.error(t("profile.savedPlaces.pickAddress"));
      return;
    }
    try {
      if (isEdit) {
        await update.mutateAsync({
          label,
          address,
          location: toGeoPoint(coords.lat, coords.lng),
        });
      } else {
        await create.mutateAsync({
          label,
          streetName,
          streetNumber,
          district,
          municipality,
          zip: zip ? Number(zip) : undefined,
          location: toGeoPoint(coords.lat, coords.lng),
        });
      }
      toast.success(
        isEdit
          ? t("profile.savedPlaces.updated")
          : t("profile.savedPlaces.added"),
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("profile.savedPlaces.editTitle")
              : t("profile.savedPlaces.add")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-3">
            <Field>
              <FieldLabel>{t("profile.savedPlaces.label")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={PinLocation01Icon} />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder={t("profile.savedPlaces.labelPlaceholder")}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel>{t("profile.savedPlaces.addressSearch")}</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <HugeiconsIcon icon={Location01Icon} />
                </InputGroupAddon>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onAddressData={handleAddressData}
                />
              </InputGroup>
            </Field>

            {!isEdit && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>
                      {t("profile.savedPlaces.streetName")}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        placeholder={t(
                          "profile.savedPlaces.streetNamePlaceholder",
                        )}
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel>{t("profile.savedPlaces.streetNo")}</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        placeholder={t(
                          "profile.savedPlaces.streetNoPlaceholder",
                        )}
                        value={streetNumber}
                        onChange={(e) => setStreetNumber(e.target.value)}
                      />
                    </InputGroup>
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>{t("profile.savedPlaces.district")}</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        placeholder={t("profile.savedPlaces.district")}
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <FieldLabel>
                      {t("profile.savedPlaces.municipality")}
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        placeholder={t(
                          "profile.savedPlaces.municipalityPlaceholder",
                        )}
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                      />
                    </InputGroup>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>{t("profile.savedPlaces.zip")}</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="12345"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </InputGroup>
                </Field>
              </>
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !coords}>
              {isPending
                ? t("profile.savedPlaces.saving")
                : isEdit
                  ? t("profile.savedPlaces.saveChanges")
                  : t("profile.savedPlaces.addBtn")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PlaceCard({ place }: { place: SavedPlace }) {
  const t = useT();
  const pin = usePinSavedPlace();
  const del = useDeleteSavedPlace();
  const [editOpen, setEditOpen] = useState(false);

  const displayAddress =
    place.address ??
    [place.streetNumber, place.streetName, place.district, place.municipality]
      .filter(Boolean)
      .join(", ");

  const existingCoords = place.location?.coordinates
    ? {
        lat: place.location.coordinates[1],
        lng: place.location.coordinates[0],
      }
    : null;

  return (
    <>
      <Card className="rounded-2xl">
        <CardContent className="flex items-center gap-4 py-4 px-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{place.label}</p>
              {place.isPinned && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                  {t("profile.savedPlaces.pinned")}
                </span>
              )}
            </div>
            {displayAddress && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {displayAddress}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-primary"
              title={
                place.isPinned
                  ? t("profile.savedPlaces.unpin")
                  : t("profile.savedPlaces.pin")
              }
              disabled={pin.isPending}
              onClick={() => pin.mutate(place._id)}
            >
              <HugeiconsIcon
                icon={place.isPinned ? PinLocation02Icon : PinLocation01Icon}
                className="size-4"
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-primary"
              onClick={() => setEditOpen(true)}
            >
              <HugeiconsIcon icon={Edit02Icon} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              disabled={del.isPending}
              onClick={() => del.mutate(place._id)}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <PlaceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        placeId={place._id}
        initial={{
          label: place.label,
          address: displayAddress,
          coords: existingCoords,
        }}
      />
    </>
  );
}

export default function SavedPlaces({ driver }: { driver?: boolean }) {
  const t = useT();
  const { data, isLoading } = useSavedPlaces();
  const places = data?.data ?? [];
  const [addOpen, setAddOpen] = useState(false);

  const pinned = places.filter((p) => p.isPinned);
  const rest = places.filter((p) => !p.isPinned);

  return (
    <div className="p-4 sm:p-8 lg:p-12 h-full w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("profile.savedPlaces.title")}</h1>
        <Button className="px-4 h-10" onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4" />
          {t("profile.savedPlaces.add")}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-accent animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && places.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <HugeiconsIcon
            icon={PinLocation01Icon}
            className="size-12 text-muted-foreground/40"
          />
          <p className="text-muted-foreground">
            {t("profile.savedPlaces.empty")}
          </p>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            {t("profile.savedPlaces.addFirst")}
          </Button>
        </div>
      )}

      {!isLoading && places.length > 0 && (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("profile.savedPlaces.pinned")}
              </h3>
              {pinned.map((p) => (
                <PlaceCard key={p._id} place={p} />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("profile.savedPlaces.others")}
                </h3>
              )}
              {rest.map((p) => (
                <PlaceCard key={p._id} place={p} />
              ))}
            </div>
          )}
        </div>
      )}

      <PlaceDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
