import { Metadata } from "next";
import AdminDriversClient from "./AdminDriversClient";

export const metadata: Metadata = {
  title: "Driver Management | ARES Car Rental",
  description: "Review, verify, approve, reject, enable and disable platform drivers.",
};

export default function AdminDriversPage() {
  return <AdminDriversClient />;
}
