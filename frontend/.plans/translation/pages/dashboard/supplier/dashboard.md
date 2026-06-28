# Supplier Dashboard Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/dashboard`
- Source: app/[locale]/(dashboard)/supplier/dashboard/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- DemoDataBadge.tsx (from supplier/\_components) — has generic "Demo Data" label/tooltip defaults; NOT page-specific, noted for future i18n

## Component Discovery

- page.tsx (server component)
  - Hardcoded strings:
    - "Supplier Dashboard | ARES Car Rental" (metadata title)
    - "Manage your fleet, track bookings, and monitor earnings from the ARES supplier portal." (metadata description)

- SupplierDashboardClient.tsx (main client component)
  - Hardcoded strings in JSX:
    - "Welcome back" greeting (line 276)
    - "Here's a snapshot of your fleet's performance." (line 277)
    - "Total Vehicles" stat label (line 244)
    - "Pending Vehicles" stat label (line 250)
    - "Active Bookings" stat label (line 256)
    - "Total Earnings" stat label (line 262)
    - "Earnings Overview" chart heading (line 312)
    - "Bookings by Status" chart heading (line 383)
    - "Earnings" tooltip label (line 343)
    - "Pending"/"Confirmed"/"Active"/"Completed"/"Cancelled" booking status chart labels (lines 213-217)
    - "Recent Activity" section heading (line 450)
    - "Pending Actions" section heading (line 515)
    - Demo activity messages (5 items, lines 94-98)
    - Demo activity times (lines 94-98)
    - Demo pending action titles/descriptions/action labels (lines 101-123)
    - "You must be signed in to view dashboard stats." error (line 194)
    - "Could not load your dashboard stats. Please try again shortly." error (line 222)

## Translation Tasks

- [x] Deep audit of all hardcoded strings
- [x] Create type file: `shared/messages/types/dashboard/supplier/dashboard.ts`
- [x] Register SupplierDashboardLabels in message schema (DashboardSchema)
- [x] Create English translation file: `shared/messages/en/dashboard/supplier/dashboard.ts`
- [x] Create Arabic translation file: `shared/messages/ar/dashboard/supplier/dashboard.ts`
- [x] Update en.ts root locale file
- [x] Update ar.ts root locale file
- [x] Replace hardcoded strings in page.tsx with generateMetadata + getTranslations
- [x] Replace hardcoded strings in SupplierDashboardClient.tsx with useTranslations
- [ ] Verify translations in UI
