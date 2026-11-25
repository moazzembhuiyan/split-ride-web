"use client";
import { Locate } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapControls,
  MapMarker,
  type MapRef,
  MarkerContent,
  Map as RideMap,
} from "@/components/ui/map";
import { useMe } from "@/hooks/shared/use-user";
import { useT } from "@/i18n";
import { useDriverStore } from "@/store/driver-store";
import { CYPRUS_CENTER } from "@/lib/cyprus";
import Find from "./find";

const dummyCars = [
  { id: "car-1", longitude: 90.401, latitude: 23.748, heading: 18 },
  { id: "car-2", longitude: 90.396, latitude: 23.742, heading: 132 },
  { id: "car-3", longitude: 90.404, latitude: 23.751, heading: 248 },
  { id: "car-4", longitude: 90.393, latitude: 23.745, heading: 310 },
  { id: "car-5", longitude: 90.398, latitude: 23.739, heading: 86 },
] as const;

const DEFAULT_CENTER: [number, number] = CYPRUS_CENTER;

function MyLocationMarker({ avatar }: { avatar: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute inline-flex size-14 rounded-full bg-blue-400 opacity-20" />
      <div className="relative z-10 flex size-11 items-center p-1 justify-center overflow-hidden rounded-full border-[3px] border-blue-500 bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.2),0_4px_20px_rgba(0,0,0,0.3)]">
        <Image
          src={avatar}
          alt="My location"
          width={44}
          height={44}
          className="object-cover"
        />
      </div>
    </div>
  );
}

export default function Page() {
  const t = useT();
  const { data: meData } = useMe();
  const avatar = meData?.data?.profileImage ?? "/user.png";
  const location = useDriverStore((s) => s.location);
  const [following, setFollowing] = useState(true);
  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);
  const isInternalMoveRef = useRef(false);

  const handleMapRef = useCallback((map: MapRef | null) => {
    setMapInstance(map);
  }, []);

  // Stop following on user drag
  useEffect(() => {
    if (!mapInstance) return;
    const onDrag = () => {
      if (!isInternalMoveRef.current) setFollowing(false);
    };
    mapInstance.on("dragstart", onDrag);
    return () => {
      mapInstance.off("dragstart", onDrag);
    };
  }, [mapInstance]);

  // Camera follows location
  useEffect(() => {
    if (!location || !following || !mapInstance) return;
    isInternalMoveRef.current = true;
    mapInstance.easeTo({ center: [location.lng, location.lat], duration: 600 });
    const t = setTimeout(() => {
      isInternalMoveRef.current = false;
    }, 700);
    return () => clearTimeout(t);
  }, [location, following, mapInstance]);

  function handleRecenter() {
    setFollowing(true);
    if (!location || !mapInstance) return;
    isInternalMoveRef.current = true;
    mapInstance.flyTo({
      center: [location.lng, location.lat],
      zoom: 16,
      duration: 1000,
    });
    setTimeout(() => {
      isInternalMoveRef.current = false;
    }, 1100);
  }

  const initialCenter: [number, number] = location
    ? [location.lng, location.lat]
    : DEFAULT_CENTER;

  return (
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-0 lg:gap-6 h-full overflow-hidden">
      <div className="h-full w-full py-6 lg:py-12 flex flex-col items-center justify-start gap-4 px-4 sm:px-8 lg:px-12 overflow-y-auto">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {t("rides.available")}
          </h1>
        </div>
        <div className="w-full space-y-2 h-full">
          <Find />
        </div>
      </div>

      <div className="relative h-56 sm:h-72 lg:h-full lg:min-h-180 overflow-hidden border-b lg:border border-border/60 bg-muted/20 lg:shadow-2xl lg:shadow-black/5 shrink-0">
        <RideMap
          ref={handleMapRef}
          center={initialCenter}
          className="h-full"
          theme="light"
          zoom={16}
        >
          <MapControls showZoom />

          {location && (
            <MapMarker
              longitude={location.lng}
              latitude={location.lat}
              rotation={location.heading ?? 0}
              rotationAlignment="map"
              pitchAlignment="map"
            >
              <MarkerContent>
                <MyLocationMarker avatar={avatar} />
              </MarkerContent>
            </MapMarker>
          )}

          {dummyCars.map((car) => (
            <MapMarker
              key={car.id}
              longitude={car.longitude}
              latitude={car.latitude}
              rotation={car.heading}
              rotationAlignment="map"
            >
              <MarkerContent>
                <Image src="/icon/car.svg" alt="Car" width={22} height={22} />
              </MarkerContent>
            </MapMarker>
          ))}
        </RideMap>

        {!following && location && (
          <button
            type="button"
            onClick={handleRecenter}
            className="absolute bottom-14 right-2 z-10 flex size-8 items-center justify-center rounded-md border border-border bg-background shadow-sm hover:bg-accent transition-colors cursor-pointer"
            aria-label="Re-center on my location"
          >
            <Locate className="size-4 text-primary" />
          </button>
        )}
      </div>
    </div>
  );
}
