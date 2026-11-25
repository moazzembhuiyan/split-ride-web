"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const CAR_FALLBACK = "/single-car.png";

export function LiveMarker({
  src,
  pingColor = "bg-cyan-400",
  ringClassName = "from-cyan-400/80 to-violet-500/80",
}: {
  src?: string | null;
  pingColor?: string;
  ringClassName?: string;
}) {
  return (
    <div className="relative flex items-center justify-center size-8">
      <span
        className={`absolute inline-flex size-8 rounded-full ${pingColor} opacity-60 animate-ping`}
      />
      <div
        className={`relative p-0.5 bg-linear-to-r ${ringClassName} rounded-full shadow-lg`}
      >
        <Avatar className="size-8 bg-background rounded-full">
          <AvatarImage src={src || CAR_FALLBACK} className={src ? "" : "object-contain p-1"} />
        </Avatar>
      </div>
    </div>
  );
}
