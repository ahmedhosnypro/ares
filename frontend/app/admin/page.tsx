import { Metadata } from "next";
import AdminDashboardClient from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | ARES Car Rental",
  description:
    "Monitor bookings, manage fleet, and oversee system performance from the ARES administrative command center.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
