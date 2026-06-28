# Create Supplier Vehicle — i18n Translation Plan

## Page Overview
- **Route**: `/(dashboard)/supplier/vehicles/create`
- **Source files**:
  - `app/[locale]/(dashboard)/supplier/vehicles/create/page.tsx`
  - `app/[locale]/(dashboard)/supplier/vehicles/create/SupplierCreateVehicleClient.tsx`
  - Shared components (rendered via VehicleDetailsClient):
    - `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient.tsx`
    - `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleInfoEditor.tsx`
    - `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/GalleryEditor.tsx`
  - Shared schema:
    - `app/[locale]/(dashboard)/supplier/vehicles/_components/VehicleForm.schema.ts`

## Translation Status
- [x] Completed

## Remaining Work (separate task)
- [ ] Wire `createSupplierVehicle` into `en.ts` and `ar.ts` root files
- [ ] Add `createSupplierVehicle` to `DashboardSchema` in `message.ts`
- [ ] Add `CreateSupplierVehicleLabels` import/export to `message.ts`

## Type & Export Names
- **Type**: `CreateSupplierVehicleLabels`
- **Export**: `createSupplierVehicle`
- **Schema key**: `createSupplierVehicle`
- **Translation path**: `dashboard.createSupplierVehicle`

## Files Created
- `shared/messages/types/dashboard/supplier/vehicles/create.ts`
- `shared/messages/en/dashboard/supplier/vehicles/create.ts`
- `shared/messages/ar/dashboard/supplier/vehicles/create.ts`

## Files Modified
- `app/[locale]/(dashboard)/supplier/vehicles/create/page.tsx` — Uses `getTranslations("dashboard.createSupplierVehicle")` for page title
- `app/[locale]/(dashboard)/supplier/vehicles/create/SupplierCreateVehicleClient.tsx` — Uses `useTranslations("dashboard.createSupplierVehicle")`; passes full `labels` prop to VehicleDetailsClient
- `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleDetailsClient.tsx` — Added optional `labels` prop (backward compatible); uses `buildSchema()` with validation labels; passes `galleryEditor`/`vehicleInfoEditor` sub-labels down
- `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/VehicleInfoEditor.tsx` — Added optional `labels` prop with `VehicleInfoEditorLabels` interface; all hardcoded strings replaced with `labels.*`
- `app/[locale]/(public)/vehicles/[vehicleId]/_components/vehicle-details/GalleryEditor.tsx` — Added optional `labels` prop with `GalleryEditorLabels` interface; all hardcoded strings replaced with `labels.*`
- `app/[locale]/(dashboard)/supplier/vehicles/_components/VehicleForm.schema.ts` — Added `VehicleFormValidationLabels` interface and `createVehicleFormSchema()` function; `useVehicleFormSchema()` hook now uses `dashboard.createSupplierVehicle.validation` namespace

## Hardcoded Strings Audit

### page.tsx
| Line | Original | Key |
|------|----------|-----|
| 87 | `"Create New Vehicle"` | `title` |

### SupplierCreateVehicleClient.tsx
| Line | Original | Key |
|------|----------|-----|
| 30 | `"You must be signed in to create a vehicle."` | `errors.notSignedIn` |
| 52 | `"Failed to get vehicle ID from response"` | `errors.vehicleIdNotFound` |

### VehicleDetailsClient.tsx (shared, used in create mode)
| Line | Original | Key |
|------|----------|-----|
| 410 | `"Undo"` | `fab.undo` |
| 432 | `"Create Vehicle"` / `"Save All Changes"` | `fab.create` / `fab.saveAll` |
| 442 | `"Redo"` | `fab.redo` |
| 465 | `"Vehicle created successfully"` | `toast.created` |
| 465 | `"Vehicle updated successfully"` | `toast.updated` |
| 307 | `"Validation failed: "` | `errors.validationFailed` |
| 322 | `"Unknown error occurred while updating the vehicle"` | `errors.unknownUpdateError` |

### VehicleForm.schema.ts
| Line | Original | Key |
|------|----------|-----|
| 7 | `"Make is required"` | `validation.makeRequired` |
| 8 | `"Model is required"` | `validation.modelRequired` |
| 11 | `"Year must be a whole number"` | `validation.yearWholeNumber` |
| 12 | `"Year must be later than 1900"` | `validation.yearMin` |
| 13 | `"Year cannot be in the future"` | `validation.yearMax` |
| 14 | `"Color is required"` | `validation.colorRequired` |
| 15 | `"License plate is required"` | `validation.licensePlateRequired` |
| 17 | `"Fuel type is required"` | `validation.fuelTypeRequired` |
| 18 | `"Seats must be at least 1"` | `validation.seatsMin` |
| 18 | `"Seats must not exceed 50"` | `validation.seatsMax` |
| 19 | `"Price per day must be greater than 0"` | `validation.priceMin` |
| 20 | `"City is required"` | `validation.cityRequired` |
| 23 | `"Category is required"` | `validation.categoryRequired` |

### VehicleInfoEditor.tsx
| Line | Original | Key |
|------|----------|-----|
| 37 | `"Vehicle Identity"` | `sections.vehicleIdentity` |
| 47 | `"Make"` | `fields.make` |
| 62 | `"Model"` | `fields.model` |
| 78 | `"Year"` | `fields.year` |
| 96 | `"Color"` | `fields.color` |
| 111 | `"License Plate"` | `fields.licensePlate` |
| 127 | `"About this vehicle"` | `sections.aboutVehicle` |
| 137 | `"Description"` | `fields.description` |
| 151 | `"Specifications"` | `sections.specifications` |
| 159 | `"Transmission"` | `fields.transmission` |
| 174 | `"Fuel Type"` | `fields.fuelType` |
| 193 | `"Seats"` | `fields.seats` |
| 210 | `"Price Per Day ($)"` | `fields.pricePerDay` |
| 222 | `"Location City"` | `fields.locationCity` |
| 233 | `"Category"` | `fields.category` |
| 258 | `"Included Features"` | `sections.includedFeatures` |
| 267 | `"Add Feature"` | `features.addFeature` |
| 288 | `"Feature Name"` | `fields.featureName` |
| 294 | `"Description"` | `fields.featureDescription` |
| 306 | `"Car Settings"` | `sections.carSettings` |
| 314 | `"Availability Status"` | `fields.availabilityStatus` |
| 315 | `"Available"` | `dropdowns.available` |
| 316 | `"Unavailable"` | `dropdowns.unavailable` |
| 328 | `"Approval Status (Admin Only)"` | `fields.approvalStatus` |
| 329 | `"Pending Review"` | `dropdowns.pendingReview` |
| 330 | `"Approved / Active"` | `dropdowns.approvedActive` |
| 331 | `"Rejected"` | `dropdowns.rejected` |

### GalleryEditor.tsx
| Line | Original | Key |
|------|----------|-----|
| 68 | `"File size exceeds 10MB limit."` | `gallery.fileSizeError` |
| 107 | `"Vehicle"` (alt) | `gallery.alt` |
| 114 | `"No image selected"` | `gallery.noImageSelected` |
| 120 | `"Featured Image"` / `"Set as Featured"` | `gallery.featuredImage` / `gallery.setAsFeatured` |
| 174 | `"No Preview"` | `gallery.noPreview` |
| 201 | `"Add"` | `gallery.add` |

### StatusChips.tsx
| Line | Original | Key |
|------|----------|-----|
| 43 | `"Unknown"` | Not translated — falls back to raw status string, handled at API level |
| 70 | `"Unknown"` | Same |

## Translation Notes
- StatusChips.tsx uses raw API status strings and `"Unknown"` fallback. These are display-level and tied to API enum values, so they are not included in this namespace.
- VehicleInfoEditor and GalleryEditor are shared components — they receive translations via props or context from the create page.
- TRUNCATED_OPTIONS values (Automatic, Manual, Gasoline, etc.) are also translated as dropdown display labels.
