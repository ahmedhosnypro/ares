import { Metadata } from "next";

/**
 * Supplier Notifications — placeholder.
 *
 * The backend endpoints for the supplier notifications module are
 * implemented and ownership-scoped:
 *
 *   - GET  /api/supplier/notifications              (paginated, filterable)
 *   - GET  /api/supplier/notifications/unread-count (topbar badge)
 *   - PUT  /api/supplier/notifications/{id}/read    (mark one as read)
 *   - PUT  /api/supplier/notifications/read-all     (mark all as read)
 *
 * This page intentionally renders only a title. The dropdown, list,
 * empty-state, and deep-link click handling will be implemented in a
 * follow-up iteration. See `./README.md` for the planned UX, payload
 * shapes, business rules and security model.
 */

export const metadata: Metadata = {
  title: "Notifications | ARES Supplier",
  description: "Supplier Notifications — placeholder page (UI pending).",
};

export default function SupplierNotificationsPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Supplier Notifications Page</h1>
      <p>
        This page is a placeholder. The notifications list, filter chips, and read/unread controls will be implemented
        in a future iteration.
      </p>
    </main>
  );
}
