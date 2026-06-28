import type { Metadata } from "next";
import AdminDriverEarningsClient from "./AdminDriverEarningsClient";

export const metadata: Metadata = { title: "Driver Earnings – Admin" };

export default function AdminDriverEarningsPage() {
  return <AdminDriverEarningsClient />;
}
