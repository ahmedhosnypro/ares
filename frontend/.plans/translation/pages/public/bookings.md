# Public Bookings Translation Tasks

## Page Overview

- Route: `/(public)/bookings`
- Source: app/[locale]/(public)/bookings/confirmation/[bookingId]/

## Translation Status

- [x] Completed

## Shared Components

- BookingCleanup (from app/(public)/bookings/confirmation/[bookingId]/\_components/) - no user-facing strings, only logger messages

## Component Discovery

- page.tsx: "Booking Confirmed!", "Your reservation has been successfully placed and paid.", "Booking Reference", "Dates", "Vehicle", "Total Paid", "My Bookings"
- ReceiptDownloadButton.tsx: "Download Receipt"

## Translation Tasks

- [x] Created type file: shared/messages/types/public/bookings.ts (PublicBookingsLabels)
- [x] Created English translation: shared/messages/en/public/bookings.ts
- [x] Created Arabic translation: shared/messages/ar/public/bookings.ts
- [x] Updated root type: shared/messages/types/message.ts (import + PublicPagesSchema)
- [x] Updated root en.ts: shared/messages/en.ts (import + publicPages)
- [x] Updated root ar.ts: shared/messages/ar.ts (import + publicPages)
- [x] Updated page.tsx: replaced 7 hardcoded strings with getTranslations('publicPages.bookings')
- [x] Updated ReceiptDownloadButton.tsx: replaced 1 hardcoded string with useTranslations('publicPages.bookings')
