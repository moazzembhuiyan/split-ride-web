export interface Vehicle {
  _id: string;
  id: string;
  provider: string;
  name: string;
  number: string;
  year: number;
  seats: 4 | 6;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiclePayload {
  name: string;
  number: string;
  year: number;
  seats: 4 | 6;
}

export type CreateMultipleVehiclesPayload = CreateVehiclePayload[];

export interface UpdateVehiclePayload {
  name?: string;
  number?: string;
  year?: number;
  seats?: 4 | 6;
}

export interface ProviderKyc {
  _id: string;
  id: string;
  provider: string;
  companyName?: string;
  companyReg?: string;
  vatNumber?: string;
  socialInsurance?: string;
  cnicFront?: string;
  cnicBack?: string;
  licenseFront?: string;
  licenseBack?: string;
  carPapers?: string[];
  ibanNumber?: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetupKycPayload {
  companyName?: string;
  companyReg?: string;
  vatNumber?: string;
  socialInsurance?: string;
  ibanNumber?: string;
  cnicFront?: string;
  cnicBack?: string;
  licenseFront?: string;
  licenseBack?: string;
  carPapers?: string[];
}

export type ChangeKycStatusPayload =
  | { status: "verified" | "pending" }
  | { status: "rejected"; rejectionReason: string };

export interface StripeStatus {
  isConnected: boolean;
  stripeAccountId: string | null;
}

export interface ConnectExistingStripePayload {
  stripeAccountId: string;
}

export interface ConnectExistingStripeResponse {
  success: boolean;
  isNewAccount: boolean;
  accountId: string;
  url: string;
  message: string;
}

export type WithdrawStatus = "pending" | "proceed" | "completed" | "cancelled";

export interface WithdrawUser {
  _id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  phone?: string;
}

export interface Withdraw {
  _id: string;
  id: string;
  user: string | WithdrawUser;
  amount: number;
  status: WithdrawStatus;
  proceedAt: string | null;
  completedAt: string | null;
  note: string | null;
  stripeTransferId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MyWithdrawsResponse {
  walletBalance: number;
  withdrawList: Withdraw[];
}

export interface MyWithdrawsPaginatedResponse {
  code: number;
  message: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: MyWithdrawsResponse;
}

export interface CreateWithdrawPayload {
  amount: number;
}

export interface ChangeWithdrawStatusPayload {
  status: "proceed" | "cancelled";
}

export interface GetWithdrawsQuery {
  status?: WithdrawStatus;
  searchTerm?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface Passenger {
  _id: string;
  id: string;
  ride: string;
  user: string;
  requestedSeats: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
