# Supplier Booking Details — Page

The UI for the Supplier portal booking details view is now implemented. It allows the supplier to view all details of a single booking made against one of their vehicles.

## Purpose

Show a supplier the full details of a single booking made against one
of their vehicles. The view is read-only — there are no approve,
reject, edit, or cancel actions on this screen at this stage.

## Backend endpoint

`GET /api/supplier/bookings/{id}`

Auth: required (JWT), role `Supplier`.

Behaviour:

- Returns `200 OK` with `SupplierBookingDetailsDto` if the booking
  exists **and** its related vehicle is owned by the authenticated
  supplier.
- Returns `404 Not Found` if the booking does not exist **or**
  belongs to another supplier. We intentionally do not return `403`
  for the wrong-owner case so booking ids cannot be enumerated.
- Returns `401 Unauthorized` / `403 Forbidden` for missing / wrong
  role respectively.

Response payload includes:

- Booking: id, number, created timestamp, pickup / return dates,
  total days, total price, status, pickup / dropoff location.
- Customer: id, name, email, phone.
- Vehicle: id, make, model, year, license plate, primary image url.
- Payment: latest known status, payment method, amount, currency,
  processed timestamp (any of these may be `null` if no payment row
  exists yet).

## Planned features

- Header with booking number + status badge + back button.
- Three logical sections: Booking summary, Customer info, Vehicle
  info, Payment info — laid out in cards (mirrors
  `app/supplier/vehicles/[id]/page.tsx` style).
- Read-only fields only. No CTAs that mutate state.
- Graceful 404 handling: "Booking not found, or you don't have
  permission to view it." (matches the supplier vehicle details
  pattern.)

## Required future components

- `SupplierBookingDetailsClient.tsx` (or inline client component).
- `getSupplierBookingById(token, id)` in
  `api-clients/supplier-bookings/supplier-bookings.ts`.
- Reuse `StatusChip` / `AvailabilityChip` style for booking +
  payment status.

## Expected filters / search

- None — this is a single-record view.

## Security / access rules

- Route gated to the `Supplier` role.
- Backend enforces `booking.vehicle.owner_user_id == currentSupplierId`
  inside the SQL `WHERE` clause; mismatched ids surface as `404` so
  the frontend should treat 404 the same way for both "doesn't
  exist" and "not yours".
- View-only — no mutation endpoints are wired to this page.
