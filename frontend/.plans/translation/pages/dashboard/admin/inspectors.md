# Admin Inspectors Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/inspectors`
- Source: app/[locale]/(dashboard)/admin/inspectors/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `app/[locale]/(dashboard)/admin/_components/UserDetailsView.tsx`

## Component Discovery

- `app/[locale]/(dashboard)/admin/inspectors/page.tsx` (Redirect stub, no hardcoded strings)
- `app/[locale]/(dashboard)/admin/inspectors/AdminInspectorsClient.tsx` (Inspectors list client component)
- `app/[locale]/(dashboard)/admin/inspectors/[id]/page.tsx` (Inspector details page)
- `app/[locale]/(dashboard)/admin/inspectors/[id]/_components/InspectorDetailsClient.tsx` (Details wrapper)
- `app/[locale]/(dashboard)/admin/inspectors/_components/AddInspectorDialog.tsx` (Add Inspector modal dialog)

## Translation Tasks

- [x] Create message type file `shared/messages/types/dashboard/admin/inspectors.ts`
- [x] Register message types in `shared/messages/types/message.ts`
- [x] Create English messages file `shared/messages/en/dashboard/admin/inspectors.ts`
- [x] Create Arabic messages file `shared/messages/ar/dashboard/admin/inspectors.ts`
- [x] Register translation files in `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Translate inspectors listing table `app/[locale]/(dashboard)/admin/inspectors/AdminInspectorsClient.tsx`
- [x] Translate add inspector modal `app/[locale]/(dashboard)/admin/inspectors/_components/AddInspectorDialog.tsx`
- [x] Verify details view client `app/[locale]/(dashboard)/admin/inspectors/[id]/_components/InspectorDetailsClient.tsx` is fully translated
