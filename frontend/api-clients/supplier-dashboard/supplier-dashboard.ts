import { apiFetchJson } from "@/utils/api-client";

/**
 * Stats payload returned by the supplier dashboard endpoint.
 *
 * GET /api/supplier/dashboard/stats
 *
 * All fields are non-negative integers/decimals scoped to the authenticated
 * supplier. The backend is the single source of truth for what counts as
 * "active" / "pending" / "earnings" — the frontend just renders the values.
 */
export interface SupplierDashboardStats {
  totalVehicles: number;
  pendingVehicles: number;
  activeBookings: number;
  totalEarnings: number;
}

/**
 * Fetch the authenticated supplier's dashboard stats.
 *
 * Auth handling matches the rest of the app: the caller passes the
 * NextAuth access token explicitly so the helper stays usable from both
 * client (`useSession`) and server contexts (`getServerSession`). This keeps
 * us aligned with the pattern already used in `app/admin/AdminDashboardClient`
 * and `api-clients/suppliers/suppliers.ts`.
 *
 * Throws `ApiError` (from `utils/api-client`) on non-2xx responses; callers
 * decide how to surface the error.
 */
export async function getSupplierDashboardStats(accessToken: string): Promise<SupplierDashboardStats> {
  return apiFetchJson<SupplierDashboardStats>("/api/supplier/dashboard/stats", {
    method: "GET",
    accessToken,
  });
}
