import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type LatLng = { lat: number; lng: number };

export interface DrivingRoute {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function fallbackRoute(origin: LatLng, destination: LatLng): DrivingRoute {
  const distanceKm = haversineKm(origin, destination);
  return {
    coordinates: [
      [origin.lng, origin.lat],
      [destination.lng, destination.lat],
    ],
    distanceKm,
    durationMinutes: Math.max(1, Math.round((distanceKm / 40) * 60)),
  };
}

export async function getDrivingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<DrivingRoute> {
  try {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" });
    const { DirectionsService, TravelMode } = await importLibrary("routes");
    const result = await new DirectionsService().route({
      origin,
      destination,
      travelMode: TravelMode.DRIVING,
    });
    const route = result.routes[0];
    const leg = route?.legs[0];
    if (!route || !leg) return fallbackRoute(origin, destination);
    const path = route.overview_path ?? [];
    return {
      coordinates: path.map(
        (p: { lat: () => number; lng: () => number }) =>
          [p.lng(), p.lat()] as [number, number],
      ),
      distanceKm: (leg.distance?.value ?? 0) / 1000,
      durationMinutes: Math.max(1, Math.round((leg.duration?.value ?? 0) / 60)),
    };
  } catch {
    return fallbackRoute(origin, destination);
  }
}
