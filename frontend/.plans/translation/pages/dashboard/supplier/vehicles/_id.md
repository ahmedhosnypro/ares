# Supplier Vehicle Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/vehicles/[id]`
- Source: app/[locale]/(dashboard)/supplier/vehicles/[id]/

## Translation Status

- [ ] Not started
- [x] In progress
- [ ] Completed

## Shared Components

- `VehicleDetailsClient` — public shared component, NOT translated here (has its own strings outside this scope)

## Component Discovery

| Component                    | File                             | Hardcoded Strings                                                                                                          |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| page.tsx                     | page.tsx                         | metaTitle, metaDescription, "Vehicle Details", "We were unable to load this vehicle right now.", "Customer" (default name) |
| SupplierVehicleDetailsClient | SupplierVehicleDetailsClient.tsx | "You must be signed in to save changes.", "Failed to upload one or more images. Please try again."                         |

## Hardcoded String Audit

### page.tsx

- L127: `"Customer"` — default user name in `normalizeReviews`
- L200: `"We were unable to load this vehicle right now."` — error message
- L234: `"Vehicle Details"` — page heading

### SupplierVehicleDetailsClient.tsx

- L33: `"You must be signed in to save changes."` — auth error
- L49: `"Failed to upload one or more images. Please try again."` — upload error

## Translation Tasks

- [x] Create type file: `shared/messages/types/dashboard/supplier/vehicles/_id.ts`
- [x] Create English translation: `shared/messages/en/dashboard/supplier/vehicles/_id.ts`
- [x] Create Arabic translation: `shared/messages/ar/dashboard/supplier/vehicles/_id.ts`
- [ ] Wire up in `shared/messages/types/message.ts` (DashboardSchema) — separate step
- [ ] Wire up in `shared/messages/en.ts` — separate step
- [ ] Wire up in `shared/messages/ar.ts` — separate step
- [x] Replace hardcoded strings in page.tsx
- [x] Replace hardcoded strings in SupplierVehicleDetailsClient.tsx
