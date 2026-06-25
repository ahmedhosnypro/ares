import { Metadata } from "next";
import SupplierBookingsClient from "./_components/SupplierBookingsClient";

export const metadata: Metadata = {
  title: "Bookings | ARES Supplier",
  description: "Supplier Bookings list.",
};

export default function SupplierBookingsPage() {
  return <SupplierBookingsClient />;
}
