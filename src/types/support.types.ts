export type SupportStatus = "pending" | "replied" | "resolved";

export interface SupportUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  phone?: string;
}

export interface Support {
  _id: string;
  id: string;
  user: SupportUser;
  name: string;
  phone: string;
  email: string;
  booking: string | null;
  reason: string;
  status: SupportStatus;
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  subject: string;
  messages: string;
  status?: SupportStatus;
  contractBy?: "phone" | "email";
  createdAt?: string;
}

export interface CreateSupportPayload {
  name: string;
  phone: string;
  booking?: string;
  reason: string;
}

export interface SendSupportMessagePayload {
  subject: string;
  messages: string;
  status?: SupportStatus;
  contractBy?: "phone" | "email";
}

export interface ChangeSupportStatusPayload {
  status: SupportStatus;
}

export interface GetSupportsQuery {
  page?: number;
  limit?: number;
  status?: SupportStatus;
  searchTerm?: string;
}
