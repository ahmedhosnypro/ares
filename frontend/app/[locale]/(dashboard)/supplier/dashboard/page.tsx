import { Metadata } from "next";
import SupplierDashboardClient from "./SupplierDashboardClient";

export const metadata: Metadata = {
  title: "Supplier Dashboard | ARES Car Rental",
  description: "Manage your fleet, track bookings, and monitor earnings from the ARES supplier portal.",
};

export default function SupplierDashboardPage() {
  return <SupplierDashboardClient />;
}
