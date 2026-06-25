import { Box, Stack, Typography } from "@mui/material";
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
  title: "Supplier Notifications | ARES Car Rental",
  description: "Supplier Notifications — placeholder page (UI pending).",
};

export default function SupplierNotificationsPage() {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 4, md: 5 } }}>
      <Stack sx={{ gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.5px" }}>
          Supplier Notifications
        </Typography>
        <Typography color="text.secondary">
          This page is a placeholder. The notifications list, filter chips, and read/unread controls will be implemented
          in a future iteration.
        </Typography>
      </Stack>
    </Box>
  );
}
