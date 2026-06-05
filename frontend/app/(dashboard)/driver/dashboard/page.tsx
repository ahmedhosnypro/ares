import { Metadata } from "next";
import DriverDashboardClient from "./DriverDashboardClient";

export const metadata: Metadata = {
  title: "Driver Dashboard | ARES",
  description: "Manage your driving requests, trips, and earnings.",
};

export default function DriverDashboardPage() {
  return <DriverDashboardClient />;
}
