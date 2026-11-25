import type { AuthUser, Gender } from "./auth.types";

export type { AuthUser as User };

export interface UpdateProfilePayload {
  name?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: Gender;
  latitude?: number;
  longitude?: number;
  address?: string;
  documents?: string[];
  language?: string;
  experience?: string;
  fcmToken?: string;
  type?: "self-employed" | "company";
}

export interface ChangeEmailPayload {
  email: string;
}

export interface ChangePhonePayload {
  countryCode: string;
  phone: string;
}

export interface UpdateLocationPayload {
  longitude: number;
  latitude: number;
  address?: string;
}

export interface DeleteProfilePayload {
  reason: string;
}

export interface ChangeUserStatusPayload {
  status: "active" | "inactive" | "blocked";
}

export interface GetUsersQuery {
  role?: "user" | "provider" | "admin";
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}
