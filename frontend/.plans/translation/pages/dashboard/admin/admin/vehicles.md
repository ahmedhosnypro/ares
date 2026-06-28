# Admin Vehicles Mgmt Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/admin/vehicles`
- Source: app/[locale]/(dashboard)/admin/admin/vehicles/

## Translation Status

- [x] Completed

## Shared Components

- None (Custom UI components rendered inside `VehiclesView`)

## Component Discovery

- `VehiclesView` (`VehiclesView.tsx`) - Custom client component for fleet management, stats, status configuration, and bulk actions.

## Translation Tasks

- [x] Create type definitions at `shared/messages/types/dashboard/admin/admin/vehicles.ts`
- [x] Register types in `shared/messages/types/message.ts`
- [x] Create English translation at `shared/messages/en/dashboard/admin/admin/vehicles.ts`
- [x] Create Arabic translation at `shared/messages/ar/dashboard/admin/admin/vehicles.ts`
- [x] Register translations in root files `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Update page file to check session on server and render localized `VehiclesView`
