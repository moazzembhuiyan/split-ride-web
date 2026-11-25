"use client";
import { useState } from "react";
import {
  CallingIcon,
  Car01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserById } from "@/hooks/shared/use-user";

interface Props {
  driverId: string;
}

export default function DriverProfile({ driverId }: Props) {
  const [open, setOpen] = useState(false);
  const { data, isPending } = useUserById(driverId);
  const driver = data?.data;

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500 cursor-pointer text-sm hover:underline">
        View driver profile
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Driver Profile</DialogTitle>
        </DialogHeader>

        {isPending ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading…
          </div>
        ) : (
          <div>
            <div className="flex flex-col justify-center items-center gap-2">
              <div className="p-0.5 bg-linear-to-r from-cyan-400/80 to-violet-500/80 rounded-full">
                <Avatar className="size-24 bg-background rounded-full">
                  <AvatarImage src={driver?.profileImage ?? "/user.png"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-lg font-bold">{driver?.name ?? "—"}</h2>
            </div>

            {/* The public profile has no email or address, and the phone only
                after a shared ride. */}
            {driver?.phone && (
              <div className="p-2 flex flex-row justify-center items-center mt-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    className="text-primary size-5"
                    icon={CallingIcon}
                  />
                  <a href={`tel:${driver.phone}`} dir="ltr">
                    {driver.phone}
                  </a>
                </div>
              </div>
            )}

            <div className="bg-secondary p-6 rounded-lg grid grid-cols-2 gap-2 mt-2">
              <div className="flex justify-center items-center flex-col gap-1">
                <h2 className="text-xl text-primary font-semibold">
                  {driver?.completedRides ?? "—"}
                </h2>
                <p className="text-xs text-muted-foreground">Rides Done</p>
              </div>
              <div className="flex justify-center items-center flex-col gap-1">
                <h2 className="text-xl text-amber-500 font-semibold flex items-center gap-1">
                  <HugeiconsIcon
                    icon={StarIcon}
                    className="size-4 fill-amber-500 text-amber-500"
                  />
                  {driver?.avgRating?.toFixed(1) ?? "—"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Rating ({driver?.totalRating ?? 0})
                </p>
              </div>
            </div>

            {defaultVehicle && (
              <div className="mt-4 bg-secondary rounded-lg p-4 flex items-center gap-3">
                <HugeiconsIcon
                  icon={Car01Icon}
                  className="size-6 text-primary shrink-0"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {defaultVehicle.name} ({defaultVehicle.year})
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-linear-to-r text-[10px]! from-cyan-400/80 to-violet-500/80 rounded-sm">
                      {defaultVehicle.number}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {defaultVehicle.seats} seats
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
