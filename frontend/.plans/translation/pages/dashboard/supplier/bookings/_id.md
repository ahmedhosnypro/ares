# Supplier Booking Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/bookings/[id]`
- Source: app/[locale]/(dashboard)/supplier/bookings/[id]/

## Translation Status

- [x] Not started
- [x] In progress
- [ ] Completed

## Shared Components

(None — all strings are local to this page)

## Component Discovery

| File                                           | Type                                     |
| ---------------------------------------------- | ---------------------------------------- |
| `page.tsx`                                     | Server component — metadata strings      |
| `_components/SupplierBookingDetailsClient.tsx` | Client component — all hardcoded strings |

## Hardcoded Strings

### page.tsx

| Category             | String                             | Key               |
| -------------------- | ---------------------------------- | ----------------- |
| Metadata title       | "Booking Details \| ARES Supplier" | `metaTitle`       |
| Metadata description | "Supplier Booking Details."        | `metaDescription` |

### SupplierBookingDetailsClient.tsx

| Category            | String                                                        | Key                           |
| ------------------- | ------------------------------------------------------------- | ----------------------------- |
| Error 404           | "Booking not found, or you don't have permission to view it." | `errors.notFoundOrDenied`     |
| Error 401           | "Your session has expired. Please sign in again."             | `errors.sessionExpired`       |
| Error 403           | "You don't have permission to view this booking."             | `errors.forbidden`            |
| Error other         | "Failed to load booking details ({status})."                  | `errors.loadFailedWithStatus` |
| Error generic       | "Failed to load booking details."                             | `errors.loadFailed`           |
| Error null fallback | "Booking not found."                                          | `errors.notFound`             |
| Back button         | "Back to Bookings"                                            | `backToBookings`              |
| Tooltip             | "Back to bookings"                                            | `backToBookingsTooltip`       |
| Header              | "Booking #{shortRef}"                                         | `header.title`                |
| Status fallback     | "Draft"                                                       | `header.statusDraft`          |
| Created label       | "Created {date}"                                              | `header.created`              |
| Section             | "Customer Information"                                        | `customerInfo.title`          |
| Field               | "Name"                                                        | `customerInfo.name`           |
| Field               | "Email"                                                       | `customerInfo.email`          |
| Field               | "Phone"                                                       | `customerInfo.phone`          |
| Section             | "Vehicle Information"                                         | `vehicleInfo.title`           |
| Label               | "Plate: {plate}"                                              | `vehicleInfo.plate`           |
| Section             | "Booking Information"                                         | `bookingInfo.title`           |
| Field               | "Pickup Date"                                                 | `bookingInfo.pickupDate`      |
| Field               | "Return Date"                                                 | `bookingInfo.returnDate`      |
| Field               | "Total Days"                                                  | `bookingInfo.totalDays`       |
| Unit                | "{count} days"                                                | `bookingInfo.daysUnit`        |
| Field               | "Pickup Location"                                             | `bookingInfo.pickupLocation`  |
| Field               | "Dropoff Location"                                            | `bookingInfo.dropoffLocation` |
| Section             | "Payment Information"                                         | `paymentInfo.title`           |
| Field               | "Total Amount"                                                | `paymentInfo.totalAmount`     |
| Field               | "Status"                                                      | `paymentInfo.status`          |
| Fallback            | "Pending"                                                     | `paymentInfo.pendingStatus`   |
| Field               | "Method"                                                      | `paymentInfo.method`          |
| Field               | "Processed At"                                                | `paymentInfo.processedAt`     |

## Translation Tasks

- [x] Create type file: `types/dashboard/supplier/bookings/_id.ts`
- [x] Create EN translation: `en/dashboard/supplier/bookings/_id.ts`
- [x] Create AR translation: `ar/dashboard/supplier/bookings/_id.ts`
- [ ] Add `SupplierBookingDetailLabels` to `message.ts` schema
- [ ] Wire into `en.ts` and `ar.ts`
- [x] Replace hardcoded strings in `SupplierBookingDetailsClient.tsx`
- [ ] Replace hardcoded strings in `page.tsx`
