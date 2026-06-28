import { apiFetchJson } from "@/utils/api-client";

export interface DriverEarningsStats {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  availableBalance: number;
  pendingPayoutAmount: number;
  completedTripsCount: number;
}

export interface DriverMonthlyEarningPoint {
  month: string;
  monthNumber: number;
  year: number;
  earnings: number;
}

export interface DriverTopBooking {
  bookingId: string;
  bookingNumber: string;
  vehicleName: string;
  customerName: string;
  netEarning: number;
  completedAt: string;
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

export interface DriverPayout {
  id: string;
  requestedAt: string;
  amount: number;
  status: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  paymobTransactionId: string | null;
  completedAt: string | null;
}

export async function getDriverEarningsStats(accessToken: string): Promise<DriverEarningsStats> {
  return apiFetchJson<DriverEarningsStats>("/api/driver/earnings/stats", {
    method: "GET",
    accessToken,
  });
}

export async function getDriverEarningsChart(accessToken: string, year?: number): Promise<DriverMonthlyEarningPoint[]> {
  const path =
    typeof year === "number" ? `/api/driver/earnings/chart?year=${year.toString()}` : "/api/driver/earnings/chart";
  return apiFetchJson<DriverMonthlyEarningPoint[]>(path, {
    method: "GET",
    accessToken,
  });
}

export async function getDriverTopBookings(accessToken: string): Promise<DriverTopBooking[]> {
  return apiFetchJson<DriverTopBooking[]>("/api/driver/earnings/top-bookings", {
    method: "GET",
    accessToken,
  });
}

export async function getDriverEarningsHistory(
  accessToken: string,
  pageNumber: number,
  pageSize: number
): Promise<DriverEarningRow[]> {
  return apiFetchJson<DriverEarningRow[]>(
    `/api/driver/earnings/history?pageNumber=${pageNumber.toString()}&pageSize=${pageSize.toString()}`,
    {
      method: "GET",
      accessToken,
    }
  );
}

export async function requestDriverPayout(accessToken: string, amount: number): Promise<DriverPayout> {
  return apiFetchJson<DriverPayout>("/api/driver/earnings/payout", {
    method: "POST",
    accessToken,
    body: JSON.stringify({ amount }),
  });
}

export async function getDriverPayouts(accessToken: string): Promise<DriverPayout[]> {
  return apiFetchJson<DriverPayout[]>("/api/driver/earnings/payouts", {
    method: "GET",
    accessToken,
  });
}
