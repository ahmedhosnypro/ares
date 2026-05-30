import { Metadata } from "next";
import SupplierEarningsClient from "./SupplierEarningsClient";

/**
 * Supplier Earnings dashboard — page entrypoint.
 *
 * Wired to the live backend endpoints (all ownership-scoped to the
 * authenticated supplier by `[Authorize(Roles = "Supplier")]` + the
 * `Vehicle.UserId == supplierId` filter in `SupplierEarningsService`):
 *
 *   - GET /api/supplier/earnings/stats         — total / this-month / last-month / completed count
 *   - GET /api/supplier/earnings/chart?year=…  — 12 monthly data points
 *   - GET /api/supplier/earnings/top-vehicles  — top 5 vehicles by lifetime earnings
 *
 * All numbers are aggregated from <c>BookingStatus.Completed</c> bookings
 * only — pending, in-flight and cancelled bookings are excluded.
 */

export const metadata: Metadata = {
  title: "Earnings | ARES Supplier",
  description: "Supplier Earnings dashboard — total earnings, monthly revenue, and top performing vehicles.",
};

export default function SupplierEarningsPage() {
  return <SupplierEarningsClient />;
}
