# Vehicles Page Translation Plan

## Route: `/(public)/vehicles/[vehicleId]`

## Status: DONE

## Components

- [x] `page.tsx` - Server component, uses `getTranslations("publicPages.vehicles.detail")`
- [x] `VehicleDetailsClient.tsx` - Uses `dashboardAdmin.vehicles` for edit labels (already translated)
- [x] `VehicleInfo.tsx` - Uses `useTranslations("publicPages.vehicles.detail")`
- [x] `BookingCard.tsx` - Uses `useTranslations("publicPages.vehicles.detail")`
- [x] `ReviewSection.tsx` - Uses `useTranslations("publicPages.vehicles.detail")`
- [x] `VerificationRequiredCard.tsx` - Uses `useTranslations("publicPages.vehicles.detail")`
- [x] `Gallery.tsx` - No hardcoded strings (label passed via props)
- [x] `GalleryEditor.tsx` - Uses labels passed via props (already handled by VehicleDetailsClient)
- [x] `VehicleInfoEditor.tsx` - Uses labels passed via props (already handled by VehicleDetailsClient)
- [x] `useFormUndoRedo.ts` - No UI strings
- [x] `types.ts` - No UI strings

## Translation Files

- [x] `types/public/vehicles.ts` - `VehiclesLabels` type (for index/list page)
- [x] `types/public/vehicles/_vehicleId.ts` - `VehicleDetailLabels` type (pre-existing)
- [x] `en/public/vehicles.ts` - English translations for index
- [x] `en/public/vehicles/_vehicleId.ts` - English translations for detail (pre-existing)
- [x] `ar/public/vehicles.ts` - Arabic translations for index
- [x] `ar/public/vehicles/_vehicleId.ts` - Arabic translations for detail (pre-existing)
- [x] `message.ts` - Updated `PublicVehiclesSchema` with `index: VehiclesLabels`
- [x] `en.ts` - Already imports `vehiclesList`
- [x] `ar.ts` - Already imports `vehiclesList`

## Namespace

- Detail page: `publicPages.vehicles.detail`
- List page: `publicPages.vehicles.index`
