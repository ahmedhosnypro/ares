import { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "My Notifications | ARES Car Rental",
  description: "Stay updated with your latest booking status, offers, and system alerts in one place.",
};

export default function CustomerNotificationsPage() {
  return <NotificationsClient />;
}
