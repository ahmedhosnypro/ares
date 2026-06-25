import { Metadata } from "next";
import SupplierBookingDetailsClient from "./_components/SupplierBookingDetailsClient";

export const metadata: Metadata = {
  title: "Booking Details | ARES Supplier",
  description: "Supplier Booking Details.",
};

export default async function SupplierBookingDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SupplierBookingDetailsClient bookingId={id} />;
}
