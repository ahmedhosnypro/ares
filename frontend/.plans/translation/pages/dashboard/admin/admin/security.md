# Admin Security Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/admin/security`
- Source: app/[locale]/(dashboard)/admin/admin/security/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- None (Custom UI components rendered inside `SecurityView`)

## Component Discovery

- `SecurityView` (`SecurityView.tsx`) - Custom client component for real-time payment security monitoring, live transaction feed and FIM status.

## Translation Tasks

- [x] Create type definitions at `shared/messages/types/dashboard/admin/admin/security.ts`
- [x] Register types in `shared/messages/types/message.ts`
- [x] Create English translation at `shared/messages/en/dashboard/admin/admin/security.ts`
- [x] Create Arabic translation at `shared/messages/ar/dashboard/admin/admin/security.ts`
- [x] Register translations in root files `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Update page file to check session on server and render localized `SecurityView`
