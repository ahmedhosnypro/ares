# Booking Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/bookings/[id]`
- Source: app/[locale]/(dashboard)/admin/bookings/[id]/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `BookingDetailsClient.tsx` (under `_components/`)

## Component Discovery

- `BookingDetailsPage` (in `page.tsx`): Wrapper page component resolving dynamic route parameter.
- `BookingDetailsClient` (in `_components/BookingDetailsClient.tsx`): Displays comprehensive booking details, status badges, payment info, vehicle/supplier details, inspection state, approval controls, refund dialogs, and activity timeline.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/bookings/_id/details.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/bookings/_id/details.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/bookings/_id/details.ts`
- [x] Register booking details translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Update `BookingDetailsClient.tsx` to use next-intl translations
