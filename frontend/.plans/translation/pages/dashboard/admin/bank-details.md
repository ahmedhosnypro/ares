# Bank Details Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/bank-details`
- Source: app/[locale]/(dashboard)/admin/bank-details/

## Translation Status

- [x] Completed

## Shared Components

- None (Custom UI components rendered inside `BankDetailsView`)

## Component Discovery

- `BankDetailsView` (`BankDetailsView.tsx`) - Custom client component for managing platform bank accounts and displaying customer-facing payment previews.

## Translation Tasks

- [x] Create type definitions at `shared/messages/types/dashboard/admin/bank-details.ts`
- [x] Register types in `shared/messages/types/message.ts`
- [x] Create English translation at `shared/messages/en/dashboard/admin/bank-details.ts`
- [x] Create Arabic translation at `shared/messages/ar/dashboard/admin/bank-details.ts`
- [x] Register translations in root files `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Update page file to check session on server and render localized `BankDetailsView`
