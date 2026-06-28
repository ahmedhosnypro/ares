# Inspection Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/inspector/inspections/[id]`
- Source: app/[locale]/(dashboard)/inspector/inspections/[id]/

## Translation Status

- [x] Not started
- [x] In progress
- [ ] Completed

## Shared Components

- `InspectionStatusBadge.tsx` — Uses parent namespace `dashboard.inspectorInspections.statusBadge`

## Component Discovery

| File | Type |
|------|------|
| `page.tsx` | Server component (no strings) |
| `_components/InspectionDetailsClient.tsx` | Client component — all hardcoded strings |
| `../../_components/InspectionStatusBadge.tsx` | Shared status badge |

## Hardcoded Strings

### InspectionDetailsClient.tsx

| Category | String | Key |
|----------|--------|-----|
| Page title | "Inspection Report" | `pageTitle` |
| Subtitle | "Review details and submit for booking #..." | `subtitle` |
| Error 403 | "You do not have access to this inspection." | `errors.accessDenied` |
| Error 404 | "Inspection not found." | `errors.notFound` |
| Error generic | "Failed to load inspection details." | `errors.loadFailed` |
| Not found fallback | "Not found" | `errors.notFoundShort` |
| Go back button | "Go Back" | `goBack` |
| Locked alert | "This inspection report has been submitted and is locked for editing." | `lockedAlert` |
| Details title | "Details" | `bookingInfo.title` |
| Booking Number | "Booking Number" | `bookingInfo.bookingNumber` |
| Vehicle | "Vehicle" | `bookingInfo.vehicle` |
| Assigned To | "Assigned To" | `bookingInfo.assignedTo` |
| Scheduled Date | "Scheduled Date" | `bookingInfo.scheduledDate` |
| Submitted At | "Submitted At" | `bookingInfo.submittedAt` |
| Vehicle Metrics | "Vehicle Metrics" | `vehicleMetrics.title` |
| Odometer Reading | "Odometer Reading" | `vehicleMetrics.odometerReading` |
| Odometer placeholder | "e.g. 45000" | `vehicleMetrics.odometerPlaceholder` |
| km unit | "km" | `vehicleMetrics.odometerUnit` |
| Fuel Level | "Fuel Level: {fuelLevel}%" | `vehicleMetrics.fuelLevel` |
| Fuel marks | "E" / "1/2" / "F" | `vehicleMetrics.fuelMarksE/Half/F` |
| Visual Evidence | "Visual Evidence ({count}/{max})" | `images.title` |
| Upload Photos | "Upload Photos" | `images.uploadButton` |
| No photos | "No photos provided" | `images.noPhotosProvided` |
| Upload prompt | "Upload Inspection Photos" | `images.uploadPrompt` |
| Drag drop hint | "Drag and drop or click to browse (Min ..., Max ...)" | `images.dragDropHint` |
| Image alt | "Inspection" | `images.altText` |
| Max images error | "Maximum {max} images allowed" | `images.maxImagesError` |
| Min images error | "At least {min} photo is required" | `images.minImagesError` |
| Condition & Notes | "Condition & Notes" | `conditions.title` |
| General condition | "Damage Report / General Condition (Optional)" | `conditions.generalConditionLabel` |
| General placeholder | "List any visible damage..." | `conditions.generalConditionPlaceholder` |
| Notes label | "Final Inspection Notes (Required)" | `conditions.notesLabel` |
| Notes placeholder | "Detailed observations..." | `conditions.notesPlaceholder` |
| Final Decision | "Final Decision" | `decision.title` |
| Approve Vehicle | "Approve Vehicle" | `decision.approve` |
| Reject Vehicle | "Reject Vehicle" | `decision.reject` |
| Decision error | "Please select a decision (Approve or Reject)" | `decision.selectDecisionError` |
| Notes required | "Please provide inspection notes" | `validation.notesRequired` |
| Odometer invalid | "Please enter a valid odometer reading" | `validation.odometerInvalid` |
| Dialog title | "Submit Inspection Report?" | `dialog.title` |
| Dialog body | "You are about to mark this vehicle as..." | `dialog.description` |
| Cancel | "Cancel" | `dialog.cancel` |
| Confirm & Submit | "Confirm & Submit" | `dialog.confirmAndSubmit` |
| Submit button | "Submit Final Report" | `submitButton` |
| Success toast | "Inspection submitted successfully" | `toast.submittedSuccessfully` |
| Failure toast | "Submission failed. Please try again." | `toast.submissionFailed` |

### InspectionStatusBadge.tsx

Status badge labels are in the parent namespace `dashboard.inspectorInspections.statusBadge` (pending/approved/rejected).

## Translation Tasks

- [x] Create type file: `types/dashboard/inspector/inspections/_id.ts`
- [x] Create EN translation: `en/dashboard/inspector/inspections/_id.ts`
- [x] Create AR translation: `ar/dashboard/inspector/inspections/_id.ts`
- [x] Add `InspectionDetailLabels` to `message.ts` schema
- [x] Wire into `en.ts` and `ar.ts`
- [ ] Replace hardcoded strings in `InspectionDetailsClient.tsx`
- [ ] Update `InspectionStatusBadge.tsx` to use `dashboard.inspectorInspections.statusBadge`
