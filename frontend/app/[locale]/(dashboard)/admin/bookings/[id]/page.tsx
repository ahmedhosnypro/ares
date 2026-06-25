import BookingDetailsClient from "./_components/BookingDetailsClient";

export const metadata = {
  title: "Booking Details | ARES Admin",
  description: "Operational details for a single booking.",
};

export default async function BookingDetailsPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookingDetailsClient bookingId={id} />;
}
