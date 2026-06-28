# Supplier Reviews Translation Tasks

## Page Overview

- Route: `/(dashboard)/supplier/reviews`
- Source: app/[locale]/(dashboard)/supplier/reviews/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `VehicleStats` — already shared, no changes needed
- `DemoDataBadge` — shared component with its own defaults, not translated here
- `RatingStars` — pure visual component, no user-visible strings

## Component Discovery

| Component             | File                                 | Hardcoded Strings                                                                    |
| --------------------- | ------------------------------------ | ------------------------------------------------------------------------------------ |
| page.tsx              | page.tsx                             | metaTitle, metaDescription                                                           |
| SupplierReviewsClient | SupplierReviewsClient.tsx            | ~55 strings (filters, stats, table, empty states, toasts, errors, tooltips, chips)   |
| RatingStars           | \_components/RatingStars.tsx         | None (pure visual)                                                                   |
| ReplyReviewDialog     | \_components/ReplyReviewDialog.tsx   | ~16 strings (title, labels, validation, buttons, alert, placeholder)                 |
| ReportReviewDialog    | \_components/ReportReviewDialog.tsx  | ~15 strings (title, description, alert, preset reasons, labels, validation, buttons) |
| ReviewDetailsDialog   | \_components/ReviewDetailsDialog.tsx | ~14 strings (title, section labels, buttons, status text)                            |

## Translation Tasks

- [x] Create type file: `shared/messages/types/dashboard/supplier/reviews.ts`
- [x] Create English translation: `shared/messages/en/dashboard/supplier/reviews.ts`
- [x] Create Arabic translation: `shared/messages/ar/dashboard/supplier/reviews.ts`
- [x] Wire up in `shared/messages/types/message.ts` (DashboardSchema)
- [x] Wire up in `shared/messages/en.ts`
- [x] Wire up in `shared/messages/ar.ts`
- [x] Replace hardcoded strings in page.tsx
- [x] Replace hardcoded strings in SupplierReviewsClient.tsx
- [x] Replace hardcoded strings in ReplyReviewDialog.tsx
- [x] Replace hardcoded strings in ReportReviewDialog.tsx
- [x] Replace hardcoded strings in ReviewDetailsDialog.tsx
