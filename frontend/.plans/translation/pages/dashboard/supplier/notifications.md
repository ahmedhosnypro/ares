# Supplier Notifications Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/notifications`
- Source: app/[locale]/(dashboard)/supplier/notifications/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- `supplier/_components/DemoDataBadge.tsx` — shared "Demo Data" chip used across the supplier dashboard

## Component Discovery

- `supplier/notifications/page.tsx`
  - Hardcoded strings in JSX:
    - "Supplier Notifications | ARES Car Rental" (metadata title)
    - "Supplier Notifications — placeholder page (UI pending)." (metadata description)
    - "Supplier Notifications" (page heading)
    - "This page is a placeholder. The notifications list, filter chips, and read/unread controls will be implemented in a future iteration." (placeholder description)

- `supplier/_components/DemoDataBadge.tsx`
  - Hardcoded strings in default props:
    - "Demo Data" (label default)
    - "Showing placeholder data — will be replaced with live metrics once available." (tooltip default)

## Translation Tasks

- [x] Create type file: `shared/messages/types/dashboard/supplier/notifications.ts`
- [x] Register `SupplierNotificationsLabels` in `DashboardSchema` (`message.ts`)
- [x] Add `supplierNotifications` to export type block in `message.ts`
- [x] Create English translation: `shared/messages/en/dashboard/supplier/notifications.ts`
- [x] Create Arabic translation: `shared/messages/ar/dashboard/supplier/notifications.ts`
- [x] Register in `en.ts` root file
- [x] Register in `ar.ts` root file
- [x] Replace hardcoded strings in page.tsx
- [x] Replace hardcoded strings in DemoDataBadge.tsx

## Namespace

- Translation path: `dashboard.supplierNotifications`
- Type name: `SupplierNotificationsLabels`
- Export name: `supplierNotifications`
- Schema key: `supplierNotifications` (in `DashboardSchema`)
