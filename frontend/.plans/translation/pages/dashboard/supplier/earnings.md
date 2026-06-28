# Supplier Earnings Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/earnings`
- Source: app/[locale]/(dashboard)/supplier/earnings/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- VehicleStats (from dashboard/_components) — receives `StatItem[]` with label/subtitle strings
- DemoDataBadge (from supplier/_components) — not used on this page currently

## Component Discovery

- page.tsx (server component)
  - Hardcoded strings in metadata:
    - `"Earnings | ARES Supplier"` (metadata title)
    - `"Supplier Earnings dashboard — total earnings, monthly revenue, and top performing vehicles."` (metadata description)

- SupplierEarningsClient.tsx (main client component)
  - Hardcoded strings in JSX:
    - `"You must be signed in to view earnings."` (×3 — stats, topVehicles, chart auth error)
    - `"Could not load your earnings stats. Please try again shortly."` (stats catch)
    - `"Could not load your top vehicles. Please try again shortly."` (topVehicles catch)
    - `"Could not load the monthly chart. Please try again shortly."` (chart catch)
    - `"Total Earnings"` (stat label)
    - `"Lifetime, completed bookings"` (stat subtitle)
    - `"This Month"` (stat label)
    - `"Revenue this calendar month"` (stat subtitle)
    - `"Last Month"` (stat label)
    - `"Revenue previous calendar month"` (stat subtitle)
    - `"Completed Bookings"` (stat label)
    - `"Lifetime, completed only"` (stat subtitle)
    - `"Earnings Dashboard"` (h5 heading)
    - `"Track your revenue… aggregated from completed bookings only."` (subtitle)
    - `"Monthly Revenue"` (chart h6)
    - `"Year selector"` (aria-label)
    - `"No revenue recorded for {year} yet."` (chart empty heading)
    - `"Completed bookings will appear here once your customers return their vehicles."` (chart empty subtitle)
    - `"Revenue"` (Tooltip formatter label)
    - `"Revenue"` (Bar name)
    - `"Top Performing Vehicles"` (h6)
    - `"Top 5"` (Chip label)
    - `"No completed bookings yet."` (top vehicles empty heading)
    - `"Once your vehicles start completing rentals, the top performers will rank here."` (top vehicles empty subtitle)
    - `"Unnamed vehicle"` (fallback vehicle name in TopVehicleRow)
    - `"booking"` / `"bookings"` (singular/plural in TopVehicleRow)
    - `"earnings"` (label in TopVehicleRow ×1 + TopVehiclesSkeleton ×1)

## Translation Tasks

- [x] Create type file: `types/dashboard/supplier/earnings.ts` — `SupplierEarningsLabels`
- [x] Register type in message schema (`DashboardSchema.supplierEarnings`)
- [x] Export `SupplierEarningsLabels` from `types/message.ts`
- [x] Create English translation file: `en/dashboard/supplier/earnings.ts`
- [x] Create Arabic translation file: `ar/dashboard/supplier/earnings.ts`
- [x] Update root `en.ts` — import + wire `supplierEarnings`
- [x] Update root `ar.ts` — import + wire `supplierEarnings`
- [x] Replace hardcoded strings in `page.tsx` with `getTranslations`
- [x] Replace hardcoded strings in `SupplierEarningsClient.tsx` with `useTranslations`
- [x] Verify translations in UI
