# Admin Compliance Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/admin/compliance`
- Source: app/[locale]/(dashboard)/admin/admin/compliance/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- None (Custom UI components rendered inside `ComplianceView`)

## Component Discovery

- `ComplianceView` (`ComplianceView.tsx`) - Custom client component for PCI DSS Compliance monitoring and SAQ progress.

## Translation Tasks

- [x] Create type definitions at `shared/messages/types/dashboard/admin/admin/compliance.ts`
- [x] Register types in `shared/messages/types/message.ts`
- [x] Create English translation at `shared/messages/en/dashboard/admin/admin/compliance.ts`
- [x] Create Arabic translation at `shared/messages/ar/dashboard/admin/admin/compliance.ts`
- [x] Register translations in root files `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Update page file to check session on server and render localized `ComplianceView`
