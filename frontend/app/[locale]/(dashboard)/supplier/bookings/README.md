# Supplier Bookings — List Page

The UI for the Supplier portal bookings list is now implemented. It provides a table view to monitor all bookings related to the supplier's vehicles.

## Purpose

Give a supplier a paginated, filterable, searchable view of every
booking made against a vehicle they own. The supplier cannot see (or
even probe) bookings that belong to vehicles owned by another supplier.

## Backend endpoint

`GET /api/supplier/bookings`

Auth: required (JWT), role `Supplier`.

Query parameters (all optional):

| Param           | Type   | Notes                                                                 |
| --------------- | ------ | --------------------------------------------------------------------- |
| `search`        | string | Matches booking number, customer first/last name, vehicle make/model. |
| `bookingStatus` | string | One of `Pending`, `Confirmed`, `Active`, `Completed`, `Cancelled`.    |
| `paymentStatus` | string | `Pending`, `Authorized`, `Captured`, `Failed`, `Refunded`, `None`.    |
| `page`          | int    | 1-based. Default `1`.                                                 |
| `pageSize`      | int    | Default `10`, hard-capped at `100`.                                   |

Response: `PagedResult<SupplierBookingListItemDto>` with each row
containing booking id + number, customer name, vehicle id/make/model
plus primary image url, pickup/return dates, total price, booking
status, payment status, and created timestamp.

## Planned features

- Backend-driven pagination (page / pageSize from query string).
- Backend-driven search and filtering — the frontend just relays
  values to the API and renders what comes back.
- Table view (responsive) with the columns: booking number,
  customer, vehicle, dates, total, booking status, payment status,
  created.
- Status badges (booking + payment) reusing the visual language from
  `app/supplier/vehicles/_components/StatusChips.tsx` where it fits.
- Row click → navigate to `/supplier/bookings/[id]`.
- Empty / error / loading states matching the rest of the supplier
  portal.
- View-only — no approve/reject/edit buttons on the list at this
  stage.

## Required future components

- `SupplierBookingsClient.tsx` — main client component.
- `api-clients/supplier-bookings/supplier-bookings.ts` — typed
  client mirroring `api-clients/supplier-vehicles/supplier-vehicles.ts`.
- Filter bar + search input + status selects.
- MUI `DataGrid` or `Table` + custom pagination.

## Expected filters / search

- Search: booking number, customer name, vehicle make/model.
- Filters: booking status, payment status.

## Security / access rules

- The route is reachable only by users with the `Supplier` role
  (enforced by `app/supplier/layout.tsx` + middleware/auth checks).
- The backend already validates that every returned booking has
  `booking.vehicle.owner_user_id == currentSupplierId`. Even if a
  supplier guesses paging/filter values, no other supplier's data
  can leak.
- No write operations are exposed on this page.
