"use client";
import {
  ArrowLeft01Icon,
  Calendar01Icon,
  Car01Icon,
  Delete02Icon,
  Edit02Icon,
  LicensePinIcon,
  SeatSelectorIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useAddVehicle,
  useDeleteVehicle,
  useMyVehicles,
  useUpdateVehicle,
} from "@/hooks/driver/use-vehicle";
import { useT } from "@/i18n";
import type { Vehicle as VehicleType } from "@/types/driver.types";

const gradientBorderStyle: React.CSSProperties = {
  border: "2px solid transparent",
  backgroundImage:
    "linear-gradient(white, white), linear-gradient(to right, #06b6d4, #8b5cf6)",
  backgroundOrigin: "border-box",
  backgroundClip: "padding-box, border-box",
  WebkitBackgroundClip: "padding-box, border-box",
};

const gradientTextStyle: React.CSSProperties = {
  backgroundImage: "linear-gradient(to right, #06b6d4, #8b5cf6)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

type FormData = { name: string; number: string; year: number; seats: 4 | 6 };

function VehicleForm({
  onBack,
  initial,
  onSubmit,
  isPending,
  title,
}: {
  onBack: () => void;
  initial?: { name: string; number: string; year: string; seats: "4" | "6" };
  onSubmit: (data: FormData) => void;
  isPending: boolean;
  title: string;
}) {
  const t = useT();
  const [name, setName] = useState(initial?.name ?? "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [year, setYear] = useState(initial?.year ?? "");
  const [seats, setSeats] = useState<"4" | "6">(initial?.seats ?? "4");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      number,
      year: Number(year),
      seats: Number(seats) as 4 | 6,
    });
  }

  return (
    <div className="p-6 h-full w-full space-y-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="cursor-pointer">
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Field>
            <FieldLabel>{t("profile.vehicle.model")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Car01Icon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("profile.vehicle.modelPlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("profile.vehicle.number")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={LicensePinIcon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("profile.vehicle.numberPlaceholder")}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("profile.vehicle.year")}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <HugeiconsIcon icon={Calendar01Icon} />
              </InputGroupAddon>
              <InputGroupInput
                placeholder={t("profile.vehicle.yearPlaceholder")}
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </InputGroup>
          </Field>

          <Field>
            <FieldLabel>{t("profile.vehicle.seats")}</FieldLabel>
            <Select
              value={seats}
              onValueChange={(v) => setSeats(v as "4" | "6")}
            >
              <SelectTrigger className="h-12 rounded-4xl border-0 bg-input/50 px-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HugeiconsIcon
                    icon={SeatSelectorIcon}
                    className="size-4 text-primary"
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">
                  4 {t("profile.vehicle.seater")}
                </SelectItem>
                <SelectItem value="6">
                  6 {t("profile.vehicle.seater")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="col-span-1 sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full px-10 py-3 font-semibold text-sm text-white cursor-pointer disabled:opacity-60"
              style={{
                backgroundImage: "linear-gradient(to right, #06b6d4, #8b5cf6)",
              }}
            >
              {isPending
                ? t("profile.me.saving")
                : t("profile.vehicle.saveChanges")}
            </button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

function AddVehicleFormWrapper({ onBack }: { onBack: () => void }) {
  const t = useT();
  const addVehicle = useAddVehicle();

  async function handleSubmit(data: FormData) {
    try {
      await addVehicle.mutateAsync(data);
      toast.success(t("profile.vehicle.addTitle"));
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add vehicle");
    }
  }

  return (
    <VehicleForm
      onBack={onBack}
      onSubmit={handleSubmit}
      isPending={addVehicle.isPending}
      title={t("profile.vehicle.addTitle")}
    />
  );
}

function EditVehicleFormWrapper({
  vehicle,
  onBack,
}: {
  vehicle: VehicleType;
  onBack: () => void;
}) {
  const updateVehicle = useUpdateVehicle(vehicle._id);

  async function handleSubmit(data: FormData) {
    try {
      await updateVehicle.mutateAsync(data);
      toast.success("Vehicle updated");
      onBack();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update vehicle",
      );
    }
  }

  return (
    <VehicleForm
      onBack={onBack}
      initial={{
        name: vehicle.name,
        number: vehicle.number,
        year: String(vehicle.year),
        seats: String(vehicle.seats) as "4" | "6",
      }}
      onSubmit={handleSubmit}
      isPending={updateVehicle.isPending}
      title="Edit Vehicle"
    />
  );
}

type ViewState = "list" | "add" | { edit: VehicleType };

export default function Vehicle({ driver: _driver }: { driver?: boolean }) {
  const t = useT();
  const [view, setView] = useState<ViewState>("list");
  const { data, isLoading } = useMyVehicles();
  const deleteVehicle = useDeleteVehicle();

  const vehicles = data?.data ?? [];

  async function handleDelete(id: string) {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Vehicle deleted");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete vehicle",
      );
    }
  }

  if (view === "add") {
    return <AddVehicleFormWrapper onBack={() => setView("list")} />;
  }

  if (typeof view === "object" && "edit" in view) {
    return (
      <EditVehicleFormWrapper
        vehicle={view.edit}
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <div className="p-6 h-full w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {t("profile.vehicle.myVehicles")}
        </h1>
        <button
          type="button"
          onClick={() => setView("add")}
          className="rounded-full px-6 py-2 font-semibold text-sm cursor-pointer"
          style={gradientBorderStyle}
        >
          <span style={gradientTextStyle}>{t("profile.vehicle.add")}</span>
        </button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!isLoading && vehicles.length === 0 && (
        <p className="text-sm text-muted-foreground">No vehicles added yet.</p>
      )}

      <div className="space-y-4">
        {vehicles.map((v) => (
          <Card key={v._id} className="py-0">
            <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 py-4">
              <Image
                src="/single-car.webp"
                alt={v.name}
                width={160}
                height={90}
                className="object-contain h-16 sm:h-20 w-auto shrink-0"
              />
              <span className="flex-1 font-semibold text-base">
                {v.name} - {v.year}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white bg-linear-to-r from-cyan-500 to-violet-500">
                  {v.number}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-purple-700">
                  {v.seats} {t("profile.vehicle.seater")}
                </span>
                <button
                  type="button"
                  onClick={() => setView({ edit: v })}
                  className="size-8 rounded-full flex items-center justify-center border border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={Edit02Icon} className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(v._id)}
                  disabled={deleteVehicle.isPending}
                  className="size-8 rounded-full flex items-center justify-center border border-red-300 text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
