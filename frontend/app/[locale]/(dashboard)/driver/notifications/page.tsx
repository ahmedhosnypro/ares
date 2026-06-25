import { Metadata } from "next";
import NotificationsClient from "@/app/[locale]/(customer)/notifications/NotificationsClient";

export const metadata: Metadata = {
  title: "Driver Notifications | ARES Car Rental",
  description:
    "New ride requests, assignments, approvals, rejections and cancellations — all your driver alerts in one place.",
};

/**
 * Driver Notifications center (Phase 11).
 *
 * Notifications are stored per-user and served by the generic, role-agnostic
 * notifications API (`GET /api/notifications`, `PUT /api/notifications/{id}/read`,
 * `PUT /api/notifications/read-all`). Driver-module events (DriverRequestNew,
 * DriverApproved, DriverRejected, DriverAssigned, DriverRemoved, DriverCancelled,
 * NoDriverAvailable, …) are delivered through that same pipeline, so we reuse
 * the shared NotificationsClient rather than duplicating the UI.
 */
export default function DriverNotificationsPage() {
  return <NotificationsClient />;
}
