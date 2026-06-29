# Vehicle Detail Translation Tasks

## Page Overview

- Route: `/(public)/vehicles/[vehicleId]`
- Source: app/[locale]/(public)/vehicles/[vehicleId]/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Component Discovery

| Component                    | Type   | Status                                                 |
| ---------------------------- | ------ | ------------------------------------------------------ |
| page.tsx                     | Server | Translated                                             |
| VehicleDetailsClient.tsx     | Client | Uses dashboardAdmin.vehicles (edit mode)               |
| BookingCard.tsx              | Client | Translated                                             |
| VerificationRequiredCard.tsx | Client | Translated                                             |
| ReviewSection.tsx            | Client | Translated                                             |
| VehicleInfo.tsx              | Client | Translated                                             |
| Gallery.tsx                  | Client | No hardcoded strings (props only)                      |
| GalleryEditor.tsx            | Client | Uses labels prop from parent (dashboardAdmin.vehicles) |
| VehicleInfoEditor.tsx        | Client | Uses labels prop from parent (dashboardAdmin.vehicles) |

## Translation Namespace

- `publicPages.vehicles.detail` — New VehicleDetailLabels type

## Files Created/Modified

### Created

- `shared/messages/types/public/vehicles/_vehicleId.ts` — VehicleDetailLabels type
- `shared/messages/en/public/vehicles/_vehicleId.ts` — English translations
- `shared/messages/ar/public/vehicles/_vehicleId.ts` — Arabic translations

### Modified

- `shared/messages/types/message.ts` — Added VehicleDetailLabels import, PublicVehiclesSchema, updated PublicPagesSchema
- `shared/messages/types/public/vehicles.ts` — Slimmed down to index-only keys
- `shared/messages/en.ts` — Added vehicleDetail/vehiclesList imports and vehicles nesting
- `shared/messages/ar.ts` — Added vehicleDetail/vehiclesList imports and vehicles nesting
- `shared/messages/en/public/vehicles.ts` — Updated to match slimmed VehiclesLabels
- `shared/messages/ar/public/vehicles.ts` — Updated to match slimmed VehiclesLabels
- `app/[locale]/(public)/vehicles/[vehicleId]/page.tsx` — Added getTranslations
- `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/BookingCard.tsx` — Added useTranslations, replaced all hardcoded strings
- `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VerificationRequiredCard.tsx` — Added useTranslations, replaced STATUS_CONTENT with hook
