# Edit Booking Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/bookings/[id]/edit`
- Source: app/[locale]/(dashboard)/admin/bookings/[id]/edit/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `EditBookingClient.tsx` (under `_components/`)

## Component Discovery

- `EditBookingPage` (in `page.tsx`): Wrapper page component resolving dynamic route parameter.
- `EditBookingClient` (in `_components/EditBookingClient.tsx`): Form for editing operational details (dates, locations, status) of a booking, recalculating rates/costs, and saving them.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/bookings/_id/edit.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/bookings/_id/edit.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/bookings/_id/edit.ts`
- [x] Register edit booking translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Update `EditBookingClient.tsx` to use next-intl translations and support placeholder/status localization
