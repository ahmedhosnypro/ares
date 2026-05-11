# Supplier Notifications — Module

Placeholder page for the Supplier portal notifications screen. The
backend is implemented and ready; this page is intentionally minimal
until the UI work is scheduled.

## Module purpose

Surface every supplier-relevant event in one place so a supplier never
misses an admin decision (vehicle approved/rejected) or a customer
action (new booking, booking completed). Combined with a topbar badge
fed by the unread-count endpoint, suppliers get a single, clear feed
of everything that needs their attention.

## Notification workflow

1. A backend operation fires the event (e.g. admin approves a vehicle,
   a customer creates a booking, a booking transitions to Completed).
2. The relevant service (`VehicleService`, `SupplierVehicleService`,
   `BookingService`) calls `INotificationService.CreateNotificationAsync`
   **best-effort** — wrapped in try/catch so notification failures never
   break the underlying flow.
3. The notification row is written to the `Notifications` table with
   `UserId = <supplier id>`, a human-readable `Title` + `Message`, and a
   structured `Type` value of the form `"<Tag>:<EntityId>"` (e.g.
   `"VehicleApproved:8a3b…"`).
4. The supplier polls `GET /api/supplier/notifications` (or the
   `unread-count` endpoint for the badge). The service parses the `Type`
   field back into a `(tag, entityId)` pair and emits explicit
   `entityType`, `entityId`, and `redirectUrl` fields on the wire DTO.
5. The supplier clicks → the frontend navigates to `redirectUrl` AND
   fires a `PUT /api/supplier/notifications/{id}/read` to flip
   `is_read = true`.

## Supported notification types (V1)

| Tag                          | Title (default)            | Entity type | Redirect URL                            | Trigger                                                                                          |
|------------------------------|----------------------------|-------------|------------------------------------------|--------------------------------------------------------------------------------------------------|
| `VehiclePendingReview`       | "Vehicle pending review"   | Vehicle     | `/supplier/vehicles/{vehicleId}`         | Supplier creates a vehicle via `POST /api/supplier/vehicles`                                     |
| `VehicleApproved`            | "Vehicle approved"         | Vehicle     | `/supplier/vehicles/{vehicleId}`         | Admin transitions a vehicle's status to `Approved` via `PUT /api/admin/cars/{id}/edit`           |
| `VehicleRejected`            | "Vehicle rejected"         | Vehicle     | `/supplier/vehicles/{vehicleId}`         | Admin transitions a vehicle's status to `Rejected` via `PUT /api/admin/cars/{id}/edit`           |
| `BookingReceived`            | "New booking received"     | Booking     | `/supplier/bookings/{bookingId}`         | Customer creates a booking via `POST /api/bookings/create`                                       |
| `BookingCompletedSupplier`   | "Booking completed"        | Booking     | `/supplier/bookings/{bookingId}`         | Booking status transitions to `Completed` via `PUT /api/admin/bookings/{id}/status`              |

The notification type list is centralised in
`Backend.Application.Services.SupplierNotificationTypes` (constants,
formatter, parser, entity-type / redirect-URL lookup).

## Read / unread system

* Every new notification is created with `is_read = false`.
* Marking as read sets `is_read = true` and stamps `ReadAt = UtcNow`.
* `GET /api/supplier/notifications?filter=all|read|unread` lets the
  frontend tab between the three views; unknown values fall back to
  `all` so an out-of-date client never gets a 400.
* `GET /api/supplier/notifications/unread-count` returns
  `{ "unreadCount": <int> }`. The endpoint is intentionally separate
  from the list so the topbar badge can be cheap to refresh without
  pulling the full feed.
* Both `PUT /api/supplier/notifications/{id}/read` and
  `PUT /api/supplier/notifications/read-all` are idempotent — calling
  them twice in a row is safe and the second call simply returns
  `updated = 0`.

## Infinite-scroll behavior

The list endpoint is a `PagedResult<SupplierNotificationDto>`:

```json
{
  "data": [ /* notifications, newest first */ ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 137,
  "totalPages": 7,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

Recommended frontend approach:

* Render `data` as a list.
* On scroll near the bottom, increment `page` and fetch the next slice.
* Stop when `page > totalPages` OR `data.length < pageSize`.
* Bind the filter chips ("All / Read / Unread") to the `filter` query
  param. Reset `page` to 1 whenever the filter changes.
* Page size defaults to 20 and is capped server-side at 100.

## Deep linking behavior

Each row in the response includes:

```jsonc
{
  "id": "…",
  "title": "Vehicle approved",
  "message": "Toyota Corolla has been approved and is now visible to customers.",
  "type": "VehicleApproved",      // tag only, entity id is on a separate field
  "isRead": false,
  "createdAt": "2026-05-11T08:21:33Z",
  "entityType": "Vehicle",         // logical entity name
  "entityId": "8a3b…",             // primary key of the entity
  "redirectUrl": "/supplier/vehicles/8a3b…"  // supplier-portal route
}
```

The frontend should treat `redirectUrl` as the source of truth for
click navigation. If `redirectUrl` is null (older or unknown type
tag), fall back to staying on the notifications page and just marking
as read.

## Expected frontend behavior

* **Topbar badge** — polls `GET /api/supplier/notifications/unread-count`
  on a sensible cadence (15–60s) and renders the count in a chip.
* **Dropdown preview** — calls `GET /api/supplier/notifications?page=1&pageSize=5`
  to show the latest 5 in a popover with a "View all" link to
  `/supplier/notifications`.
* **Full page** (this route) — paginated list + filter chips, with
  click-to-read + click-to-deep-link as described above.

## Security / access rules

* The route is reachable only by users with the `Supplier` role
  (enforced by `app/supplier/layout.tsx` + middleware/auth checks).
* The backend filters every list/count query by
  `Notification.UserId == currentSupplierId` directly in the SQL
  `WHERE` clause — forged supplier ids only ever surface zero rows.
* Mark-as-read enforces the same ownership in the underlying
  `INotificationRepository.MarkAsReadForUserAsync` helper, which
  matches on both `Id` and `UserId`. A request for someone else's
  notification id silently no-ops; we never differentiate between
  "doesn't exist" and "not yours".
* Mark-all-as-read only touches rows where `UserId == supplierId`.
* No notification mutation endpoint exposes the underlying user id —
  it is always sourced from the JWT claim, never from request input.

## Future realtime upgrade

The current model is pull-based (the frontend polls). Adding push has
a clean path:

1. Add a SignalR (or WebSocket) hub. Suppliers connect to a group
   keyed by their user id.
2. After `INotificationService.CreateNotificationAsync` writes the
   row, broadcast a lightweight `{ id, type, title }` payload to the
   matching supplier's group.
3. The frontend listens and either prepends the new row to its cached
   list, bumps the topbar badge, or both — no change required to the
   REST endpoints, which remain the source of truth for backfill /
   reload.

The structured `Type` tag + `entityId` parsing also means a future
backend can attach extra metadata (e.g. severity, action buttons)
without changing the wire shape — just extend the `SupplierNotificationDto`
record with optional fields and populate them in the service.
