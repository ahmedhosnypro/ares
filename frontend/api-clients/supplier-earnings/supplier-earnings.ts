import { apiFetchJson } from "@/utils/api-client";

/**
 * Earnings analytics API client for the Supplier portal.
 *
 * Mirrors the conventions used by `api-clients/supplier-dashboard`:
 *   - Callers pass the NextAuth `accessToken` explicitly, so the helpers
 *     stay usable from both client (`useSession`) and server (`getServerSession`)
 *     contexts.
 *   - `apiFetchJson` handles the base URL, JSON parsing, and throws
 *     `ApiError` on non-2xx responses; this file owns no error UX.
 *   - Types match the backend DTOs in
 *     `backend/Application/DTOs/Earnings/` exactly. The wire format is
 *     camelCase via the default ASP.NET Core JSON options.
 *
 * Backend endpoints (all under `[Authorize(Roles = "Supplier")]`):
 *   GET /api/supplier/earnings/stats
 *   GET /api/supplier/earnings/chart?year={year}
 *   GET /api/supplier/earnings/top-vehicles
 */

/** Headline stats — `SupplierEarningsStatsDto` on the backend. */
export interface SupplierEarningsStats {
  totalEarnings: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  completedBookingsCount: number;
}

/** One bar of the monthly revenue chart — `MonthlyRevenuePointDto`. */
export interface MonthlyRevenuePoint {
  /** Abbreviated month name, e.g. "Jan". */
  month: string;
  /** 1-based month number (1..12). */
  monthNumber: number;
  /** Calendar year, e.g. 2026. */
  year: number;
  /** Sum of TotalPrice for completed bookings in this month. */
  revenue: number;
}

/** One row of the top performing vehicles list — `SupplierTopVehicleDto`. */
export interface SupplierTopVehicle {
  vehicleId: string;
  make: string;
  model: string;
  /** Primary image URL, or empty string if the vehicle has no images. */
  imageUrl: string;
  totalEarnings: number;
  completedBookingsCount: number;
}

/**
 * Fetch the four headline earnings figures (total / this month / last month / completed count).
 */
export async function getSupplierEarningsStats(accessToken: string): Promise<SupplierEarningsStats> {
  return apiFetchJson<SupplierEarningsStats>("/api/supplier/earnings/stats", {
    method: "GET",
    accessToken,
  });
}

/**
 * Fetch the 12-month revenue chart for the given calendar year (defaults
 * to the current UTC year if omitted). The backend always returns exactly
 * 12 points, in calendar order, with zero-revenue months filled in.
 */
export async function getSupplierEarningsChart(accessToken: string, year?: number): Promise<MonthlyRevenuePoint[]> {
  const path =
    typeof year === "number" ? `/api/supplier/earnings/chart?year=${year.toString()}` : "/api/supplier/earnings/chart";
  return apiFetchJson<MonthlyRevenuePoint[]>(path, {
    method: "GET",
    accessToken,
  });
}

/**
 * Fetch the top 5 vehicles owned by the authenticated supplier, ranked
 * by lifetime completed-booking earnings (descending). Vehicles with no
 * completed bookings are excluded by the backend, so the array length is
 * 0..5 — never larger.
 */
export async function getSupplierTopVehicles(accessToken: string): Promise<SupplierTopVehicle[]> {
  return apiFetchJson<SupplierTopVehicle[]>("/api/supplier/earnings/top-vehicles", {
    method: "GET",
    accessToken,
  });
}
