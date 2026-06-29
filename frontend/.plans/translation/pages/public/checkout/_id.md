# Checkout Translation Tasks

## Page Overview

- Route: `/(public)/checkout/[id]`
- Source: app/[locale]/(public)/checkout/[id]/

## Translation Status

- [x] Not started
- [x] In progress
- [ ] Completed

## Shared Components

None — single page.tsx file with inline sub-components.

## Component Discovery

- `page.tsx` — `CheckoutGatePage` (main), `BookingSummary` (inline), `AuthGate` (inline)

## Hardcoded Strings Found

### BookingSummary

- "Your Booking" → `yourBooking`
- "Vehicle" → `vehicle`
- "Pickup" → `pickup`
- "Return" → `return`
- "Duration" → `duration`
- "day" / "days" → `day` / `days`
- "Total" → `total`

### AuthGate

- "Almost there!" → `almostThere`
- "Sign in or create a free account to complete your booking. It only takes a minute." → `authPrompt`
- "Sign in to my account" → `signInToAccount`
- "Create a free account" → `createFreeAccount`
- "Your booking details are saved and will be confirmed right after you sign in." → `bookingSavedNote`

### CheckoutGatePage

- "Complete your booking" → `pageTitle`
- "You're one step away from reserving your vehicle." → `pageSubtitle`
- "Taking you to driver selection…" → `takingToDriverSelection`
- "Unable to continue to checkout. Please try again." → `redirectError`

## Translation Tasks

- [x] Type file created: `shared/messages/types/public/checkout.ts`
- [x] English translation created: `shared/messages/en/public/checkout.ts`
- [x] Arabic translation created: `shared/messages/ar/public/checkout.ts`
- [x] Root type file updated: `shared/messages/types/message.ts`
- [x] Root en.ts updated
- [x] Root ar.ts updated
- [x] Component updated with `useTranslations('publicPages.checkout')`
- [ ] Linting verified
