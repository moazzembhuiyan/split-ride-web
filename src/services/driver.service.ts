import { howl } from "@/lib/api";
import type { ApiResponse, PagedResponse } from "@/types/base";
import type {
  ChangeKycStatusPayload,
  ChangeWithdrawStatusPayload,
  ConnectExistingStripePayload,
  ConnectExistingStripeResponse,
  CreateMultipleVehiclesPayload,
  CreateVehiclePayload,
  CreateWithdrawPayload,
  GetWithdrawsQuery,
  MyWithdrawsPaginatedResponse,
  ProviderKyc,
  StripeStatus,
  UpdateVehiclePayload,
  Vehicle,
  Withdraw,
} from "@/types/driver.types";

export const vehicleService = {
  getMyVehicles: () =>
    howl<ApiResponse<Vehicle[]>>("/vehicles"),

  addVehicle: (payload: CreateVehiclePayload) =>
    howl<ApiResponse<Vehicle>>("/vehicles", { method: "POST", body: payload }),

  addMultipleVehicles: (payload: CreateMultipleVehiclesPayload) =>
    howl<ApiResponse<Vehicle[]>>("/vehicles/multiple", { method: "POST", body: payload }),

  updateVehicle: (id: string, payload: UpdateVehiclePayload) =>
    howl<ApiResponse<Vehicle>>(`/vehicles/${id}`, { method: "PUT", body: payload }),

  deleteVehicle: (id: string) =>
    howl<ApiResponse<null>>(`/vehicles/${id}`, { method: "DELETE" }),
};

export const kycService = {
  setupKyc: (payload: Partial<ProviderKyc>) =>
    howl<ApiResponse<ProviderKyc>>("/provider", { method: "POST", body: payload }),

  // Admin
  getAllKyc: () =>
    howl<ApiResponse<ProviderKyc[]>>("/provider"),

  getKycById: (id: string) =>
    howl<ApiResponse<ProviderKyc>>(`/provider/${id}`),

  getKycByUserId: (id: string) =>
    howl<ApiResponse<ProviderKyc>>(`/provider/user/${id}`),

  changeKycStatus: (id: string, payload: ChangeKycStatusPayload) =>
    howl<ApiResponse<ProviderKyc>>(`/provider/${id}`, { method: "PATCH", body: payload }),
};

export const stripeService = {
  checkConnection: () =>
    howl<ApiResponse<StripeStatus>>("/stripe/check-connection"),

  getAccountStatus: () =>
    howl<ApiResponse<StripeStatus>>("/stripe/account-status"),

  connectStripe: () =>
    howl<ApiResponse<string>>("/stripe/connect"),

  connectExisting: (payload: ConnectExistingStripePayload) =>
    howl<ApiResponse<ConnectExistingStripeResponse>>("/stripe/connect-existing", { method: "POST", body: payload }),

  disconnect: () =>
    howl<ApiResponse<null>>("/stripe/disconnect", { method: "DELETE" }),
};

export const withdrawService = {
  createWithdraw: (payload: CreateWithdrawPayload) =>
    howl<ApiResponse<Withdraw>>("/withdraw", { method: "POST", body: payload }),

  getMyWithdraws: (query?: GetWithdrawsQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return howl<MyWithdrawsPaginatedResponse>(`/withdraw/my-withdraws${qs ? `?${qs}` : ""}`);
  },

  // Admin
  getAllWithdraws: (query?: GetWithdrawsQuery) => {
    const params = new URLSearchParams();
    if (query?.status) params.set("status", query.status);
    if (query?.searchTerm) params.set("searchTerm", query.searchTerm);
    if (query?.minAmount != null) params.set("minAmount", String(query.minAmount));
    if (query?.maxAmount != null) params.set("maxAmount", String(query.maxAmount));
    if (query?.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query?.dateTo) params.set("dateTo", query.dateTo);
    if (query?.page) params.set("page", String(query.page));
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return howl<PagedResponse<Withdraw>>(`/withdraw${qs ? `?${qs}` : ""}`);
  },

  getWithdrawById: (id: string) =>
    howl<ApiResponse<Withdraw>>(`/withdraw/${id}`),

  changeWithdrawStatus: (id: string, payload: ChangeWithdrawStatusPayload) =>
    howl<ApiResponse<Withdraw>>(`/withdraw/${id}`, { method: "PATCH", body: payload }),
};
