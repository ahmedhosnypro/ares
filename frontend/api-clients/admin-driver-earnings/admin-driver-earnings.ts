import { apiFetchJson } from "@/utils/api-client";

export interface AdminDriverEarningsOverview {
  driverProfileId: string;
  driverName: string;
  profilePictureUrl: string | null;
  totalEarnings: number;
  availableBalance: number;
  pendingPayoutAmount: number;
  paidOutAmount: number;
  completedTripsCount: number;
  hasPaymentInfo: boolean;
  isWalletVerified: boolean;
}

export interface AdminDriverPayoutListItem {
  payoutId: string;
  driverProfileId: string;
  driverName: string;
  amount: number;
  status: string;
  requestedAt: string;
  reviewedAt: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  paymobTransactionId: string | null;
  walletPhoneNumber: string | null;
  isWalletVerified: boolean;
}

export interface PlatformDriverEarningsSummary {
  totalDriverEarnings: number;
  totalPlatformDeduction: number;
  totalPayoutsCompleted: number;
  totalPendingPayouts: number;
  totalActiveDrivers: number;
  pendingPayoutRequests: number;
  pendingWalletVerifications: number;
}

export interface DriverEarningRow {
  bookingId: string;
  bookingNumber: string;
  completedAt: string;
  grossEarning: number;
  platformDeduction: number;
  netEarning: number;
  status: string;
}

export async function getAdminDriverEarningsOverview(
  driverProfileId: string,
  accessToken: string
): Promise<AdminDriverEarningsOverview> {
  return apiFetchJson<AdminDriverEarningsOverview>(`/api/admin/driver-earnings/overview/${driverProfileId}`, {
    method: "GET",
    accessToken,
  });
}

export async function getAdminPendingPayouts(accessToken: string): Promise<AdminDriverPayoutListItem[]> {
  return apiFetchJson<AdminDriverPayoutListItem[]>("/api/admin/driver-earnings/payouts/pending", {
    method: "GET",
    accessToken,
  });
}

export async function getAdminPendingVerifications(accessToken: string): Promise<AdminDriverPayoutListItem[]> {
  return apiFetchJson<AdminDriverPayoutListItem[]>("/api/admin/driver-earnings/pending-verification", {
    method: "GET",
    accessToken,
  });
}

export async function approveAdminPayout(payoutId: string, accessToken: string): Promise<void> {
  await apiFetchJson(`/api/admin/driver-earnings/payouts/${payoutId}/approve`, {
    method: "POST",
    accessToken,
  });
}

export async function rejectAdminPayout(payoutId: string, reason: string, accessToken: string): Promise<void> {
  await apiFetchJson(`/api/admin/driver-earnings/payouts/${payoutId}/reject`, {
    method: "POST",
    accessToken,
    body: JSON.stringify({ reason }),
  });
}

export async function retryAdminPayout(payoutId: string, accessToken: string): Promise<void> {
  await apiFetchJson(`/api/admin/driver-earnings/payouts/${payoutId}/retry`, {
    method: "POST",
    accessToken,
  });
}

export async function verifyAdminWallet(driverProfileId: string, accessToken: string): Promise<void> {
  await apiFetchJson(`/api/admin/driver-earnings/${driverProfileId}/verify-wallet`, { method: "POST", accessToken });
}

export async function getAdminDriverEarningsHistory(
  driverProfileId: string,
  accessToken: string,
  pageNumber = 1,
  pageSize = 20
): Promise<DriverEarningRow[]> {
  return apiFetchJson<DriverEarningRow[]>(
    `/api/admin/driver-earnings/history/${driverProfileId}?pageNumber=${pageNumber.toString()}&pageSize=${pageSize.toString()}`,
    { method: "GET", accessToken }
  );
}

export async function getAdminPlatformSummary(accessToken: string): Promise<PlatformDriverEarningsSummary> {
  return apiFetchJson<PlatformDriverEarningsSummary>("/api/admin/driver-earnings/summary", {
    method: "GET",
    accessToken,
  });
}
