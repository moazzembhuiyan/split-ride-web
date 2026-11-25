export interface MetaTransaction {
  id: string;
  transactionId: string;
  customer: string;
  customerPhoto: string;
  bookingId: string;
  amount: number;
  method: string;
  status: "paid" | "unpaid" | "refunded";
  createdAt: string;
}

export interface MetaSalesReport {
  totalIncome: number;
  platformCommission: number;
  refunded: number;
  netIncome: number;
}

export interface AdminMeta {
  totalUsers: number;
  totalRiders: number;
  totalDrivers: number;
  totalBookings: number;
  totalEarning: number;
  totalPlatformCommission: number;
  totalProviderEarning: number;
  completedBookings?: number;
  cancelledBookings?: number;
  /** Cancelled share of finished bookings, in percent. */
  cancellationRate?: number;
  /** All-time refunds. */
  totalRefunded?: number;
  totalRefundCount?: number;
  salesReport: MetaSalesReport;
  recentTransactions: MetaTransaction[];
}

export type MetaAmountSort = "asc" | "desc";

export interface AccountDeletionUser {
  _id: string;
  name?: string;
  email?: string;
  profileImage?: string | null;
  createdAt?: string;
  role?: string;
}

export interface AccountDeletion {
  _id: string;
  id?: string;
  user: AccountDeletionUser;
  reason: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountDeletionListMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface AccountDeletionListResponse {
  code: number;
  message: string;
  pagination: AccountDeletionListMeta;
  data: AccountDeletion[];
}
