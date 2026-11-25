/** Nicosia — default map center for Cyprus. [lng, lat] for Mapbox, lat/lng object for Google. */
export const CYPRUS_CENTER: [number, number] = [33.3823, 35.1856];
export const CYPRUS_CENTER_LATLNG = { lat: 35.1856, lng: 33.3823 };

/** Bounding box used to reject non-Cyprus pins and constrain the map camera. */
const CYPRUS_BOUNDS = {
  minLat: 34.4,
  maxLat: 35.85,
  minLng: 32.05,
  maxLng: 34.75,
};

/** MapLibre `maxBounds`: [[west, south], [east, north]]. */
export const CYPRUS_MAX_BOUNDS: [[number, number], [number, number]] = [
  [CYPRUS_BOUNDS.minLng, CYPRUS_BOUNDS.minLat],
  [CYPRUS_BOUNDS.maxLng, CYPRUS_BOUNDS.maxLat],
];

export const CYPRUS_AIRPORTS = [
  {
    label: "Larnaca International Airport (LCA), Cyprus",
    lat: 34.8751,
    lng: 33.6249,
    aliases: ["lca", "larnaca", "larnaka"],
  },
  {
    label: "Paphos International Airport (PFO), Cyprus",
    lat: 34.718,
    lng: 32.4857,
    aliases: ["pfo", "paphos", "pafos"],
  },
] as const;

export function isInCyprus(lat: number, lng: number): boolean {
  return (
    lat >= CYPRUS_BOUNDS.minLat &&
    lat <= CYPRUS_BOUNDS.maxLat &&
    lng >= CYPRUS_BOUNDS.minLng &&
    lng <= CYPRUS_BOUNDS.maxLng
  );
}
