# Supplier Bookings Translation Tasks

## Page Overview
- Route: `/(dashboard)/supplier/bookings`
- Source: app/[locale]/(dashboard)/supplier/bookings/

## Translation Status
- [ ] Not started
- [x] In progress
- [ ] Completed

## Shared Components
- `DemoDataBadge` — shared component with its own defaults from `dashboard.supplierNotifications`, not translated here

## Component Discovery
| Component | File | Hardcoded Strings |
|---|---|---|
| page.tsx | page.tsx | metaTitle, metaDescription |
| SupplierBookingsClient | _components/SupplierBookingsClient.tsx | ~30 strings (title, subtitle, search placeholder, filter labels/options, table headers, status labels, empty state, footer, action menu, defaults) |

## Translation Tasks
- [x] Create type file: `shared/messages/types/dashboard/supplier/bookings.ts`
- [ ] Register type in message schema (`shared/messages/types/message.ts`)
- [x] Create English translation file: `shared/messages/en/dashboard/supplier/bookings.ts`
- [x] Create Arabic translation file: `shared/messages/ar/dashboard/supplier/bookings.ts`
- [ ] Update root translation files (`shared/messages/en.ts`, `shared/messages/ar.ts`)
- [x] Replace hardcoded strings with translation hooks
- [ ] Verify translations in UI
