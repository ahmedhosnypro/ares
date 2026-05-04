import BookingsClient from "./_components/BookingsClient";

export const metadata = {
  title: "Bookings Management | ARES Admin",
  description: "Manage all vehicle bookings in the ARES platform",
};

export default function BookingsPage() {
  // Server-side logic can go here (e.g., verifying roles via standard NextAuth server methods)
  return <BookingsClient />;
}
