import type { Metadata } from "next";
import DriverEarningsDetailClient from "./DriverEarningsDetailClient";

export const metadata: Metadata = { title: "Driver Earnings Detail – Admin" };

export default function DriverEarningsDetailPage() {
  return <DriverEarningsDetailClient />;
}
