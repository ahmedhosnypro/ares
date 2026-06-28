# Supplier Vehicles Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/vehicles`
- Source: app/[locale]/(dashboard)/supplier/vehicles/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `DemoDataBadge` — shared component with its own translation namespace (`dashboard.supplierNotifications`), not translated here
- `StatusChips` — updated to use `dashboard.supplierVehicles` translations for chip labels
- `VehicleForm.schema` — validation messages already handled by `dashboard.createSupplierVehicle.validation` namespace (completed in create page task)

## Component Discovery

| Component | File | Hardcoded Strings |
|---|---|---|
| page.tsx | page.tsx | 2 (metaTitle, metaDescription) |
| SupplierVehiclesClient | SupplierVehiclesClient.tsx | ~45 strings (title, description, filters, empty states, table headers/footers, delete dialog, tooltips, toasts, errors) |
| VehicleTableRow | SupplierVehiclesClient.tsx (inline) | ~10 strings (tooltips, perDay label) |
| StatusChips | _components/StatusChips.tsx | 2 ("Unknown" x2) + 6 chip labels |
| VehicleForm.schema | _components/VehicleForm.schema.ts | Already translated via `dashboard.createSupplierVehicle.validation` |

## Translation Tasks

- [x] Create type file: `shared/messages/types/dashboard/supplier/vehicles.ts`
- [x] Create English translation: `shared/messages/en/dashboard/supplier/vehicles.ts`
- [x] Create Arabic translation: `shared/messages/ar/dashboard/supplier/vehicles.ts`
- [ ] Wire up in `shared/messages/types/message.ts` (DashboardSchema) — separate task
- [ ] Wire up in `shared/messages/en.ts` — separate task
- [ ] Wire up in `shared/messages/ar.ts` — separate task
- [x] Replace hardcoded strings in page.tsx
- [x] Replace hardcoded strings in SupplierVehiclesClient.tsx
- [x] Replace hardcoded strings in VehicleTableRow (inline in SupplierVehiclesClient.tsx)
- [x] Replace hardcoded strings in StatusChips.tsx

## Key Translation Paths

| Key | English | Arabic |
|-----|---------|--------|
| metaTitle | My Vehicles \| ARES Supplier | مركباتي \| ARES المورد |
| title | My Vehicles | مركباتي |
| addNewVehicle | Add New Vehicle | إضافة مركبة جديدة |
| chips.pending | Pending | قيد المراجعة |
| chips.approved | Approved | معتمد |
| chips.rejected | Rejected | مرفوض |
| chips.available | Available | متاح |
| chips.unavailable | Unavailable | غير متاح |
| chips.fullyBooked | Fully Booked | محجوز بالكامل |
| deleteDialog.body | You're about to remove {make} {model}... | أنت على وشك إزالة {make} {model}... |
