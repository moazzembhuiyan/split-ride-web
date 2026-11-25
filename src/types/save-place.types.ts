export interface GeoPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface SavedPlace {
  _id: string;
  id: string;
  user: string;
  label: string;
  streetName?: string;
  streetNumber?: string;
  district?: string;
  municipality?: string;
  zip?: number;
  address?: string;
  location: GeoPoint;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedPlacePayload {
  label: string;
  streetName?: string;
  streetNumber?: string;
  district?: string;
  municipality?: string;
  zip?: number;
  location: GeoPoint;
}

export interface UpdateSavedPlacePayload {
  label?: string;
  address?: string;
  location?: GeoPoint;
}
