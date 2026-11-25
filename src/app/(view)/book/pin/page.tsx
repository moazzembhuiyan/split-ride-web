"use client";
import { MapPin, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { MapControls, type MapRef, Map as RideMap } from "@/components/ui/map";
import { CYPRUS_CENTER, isInCyprus } from "@/lib/cyprus";
import { useBookingStore } from "@/store/booking-store";
import { toast } from "sonner";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_CENTER: [number, number] = CYPRUS_CENTER;

export default function Page() {
  const router = useRouter();
  const params = useSearchParams();
  const forField = (params.get("for") ?? "pickup") as "pickup" | "destination";

  const setRequest = useBookingStore((s) => s.setRequest);
  const hasHydrated = useBookingStore((s) => s.hasHydrated);
  const existingRequest = useBookingStore((s) => s.request);
  const existing =
    forField === "pickup"
      ? existingRequest.pickup
      : existingRequest.destination;

  const [mapInstance, setMapInstance] = useState<MapRef | null>(null);
  const [center, setCenter] = useState({
    lat: existing?.lat ?? DEFAULT_CENTER[1],
    lng: existing?.lng ?? DEFAULT_CENTER[0],
  });
  const [address, setAddress] = useState(existing?.address ?? "");
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipGeocodeRef = useRef(false);
  const appliedDraftRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || appliedDraftRef.current) return;
    if (!existing?.lat || !existing?.lng) return;
    appliedDraftRef.current = true;
    setCenter({ lat: existing.lat, lng: existing.lng });
    setAddress(existing.address ?? "");
    mapInstance?.flyTo({
      center: [existing.lng, existing.lat],
      zoom: 16,
      duration: 0,
    });
  }, [hasHydrated, existing?.lat, existing?.lng, existing?.address, mapInstance]);

  const initialCenter: [number, number] =
    existing?.lat && existing?.lng
      ? [existing.lng, existing.lat]
      : DEFAULT_CENTER;

  const handleMapRef = useCallback((map: MapRef | null) => {
    setMapInstance(map);
  }, []);

  // Reverse geocode on map moveend
  useEffect(() => {
    if (!mapInstance) return;

    const onMoveEnd = () => {
      if (skipGeocodeRef.current) {
        skipGeocodeRef.current = false;
        return;
      }
      const c = mapInstance.getCenter();
      const lat = c.lat;
      const lng = c.lng;
      setCenter({ lat, lng });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setGeocoding(true);
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&region=cy&key=${API_KEY}`,
          );
          const json = await res.json();
          if (json.results?.[0]) {
            setAddress(json.results[0].formatted_address);
          }
        } finally {
          setGeocoding(false);
        }
      }, 500);
    };

    mapInstance.on("moveend", onMoveEnd);
    return () => {
      mapInstance.off("moveend", onMoveEnd);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mapInstance]);

  function handleConfirm() {
    if (!isInCyprus(center.lat, center.lng)) {
      toast.error("Pickup and destination must be in Cyprus.");
      return;
    }
    setRequest({ [forField]: { lat: center.lat, lng: center.lng, address } });
    router.back();
  }

  const label = forField === "pickup" ? "Pickup Location" : "Destination";

  return (
    <div className="grid grid-cols-2 h-[calc(100vh-64px)]">
      {/* ── Left panel ── */}
      <div className="flex flex-col px-8 py-8 gap-5 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="flex items-center justify-center size-8 rounded-full bg-muted/60 hover:bg-muted transition-colors shrink-0"
          >
            <X className="size-4" />
          </Link>
          <span className="font-semibold text-base">Pin {label}</span>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold">Set {label}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Search an address or pan the map to place the pin
          </p>
        </div>

        {/* Address search — uses existing AddressAutocomplete which loads Maps API */}
        <div className="relative flex items-center h-12 rounded-4xl border border-border bg-input/50 px-4 overflow-visible">
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            onCoordinates={(lat, lng) => {
              skipGeocodeRef.current = true;
              setCenter({ lat, lng });
              mapInstance?.flyTo({
                center: [lng, lat],
                zoom: 16,
                duration: 900,
              });
            }}
          />
        </div>

        {/* Selected address display */}
        <div className="rounded-2xl border border-border bg-muted/20 p-4 flex items-start gap-3 min-h-16">
          <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {geocoding ? (
              <p className="text-sm text-muted-foreground animate-pulse">
                Getting address…
              </p>
            ) : address ? (
              <p className="text-sm font-medium">{address}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pan the map to select a location
              </p>
            )}
            {center.lat !== 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!address || geocoding}
            className="w-full h-12 rounded-4xl bg-linear-to-r from-cyan-400 via-violet-500 to-pink-400 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Confirm {label}
          </button>
        </div>
      </div>

      {/* ── Map with centered pin ── */}
      <div className="relative h-full overflow-hidden">
        <RideMap
          ref={handleMapRef}
          center={initialCenter}
          zoom={14}
          className="h-full"
          theme="light"
        >
          <MapControls showZoom />
        </RideMap>

        {/* Fixed center crosshair pin */}
        <div className="absolute inset-0 pointer-events-none flex items-end justify-center z-10 pb-[50%]">
          <div className="flex flex-col items-center">
            <div className="size-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-lg">
              <MapPin className="size-5 text-primary" fill="currentColor" />
            </div>
            <div className="w-0.5 h-3 bg-primary/70" />
            <div className="w-3 h-1 rounded-full bg-black/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
