# Admin Drivers Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/drivers`
- Source: app/[locale]/(dashboard)/admin/drivers/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `app/[locale]/(dashboard)/admin/_components/UserDetailsView.tsx`

## Component Discovery

- `app/[locale]/(dashboard)/admin/drivers/page.tsx` (Redirect stub, no hardcoded strings)
- `app/[locale]/(dashboard)/admin/drivers/AdminDriversClient.tsx` (Drivers list client component)
- `app/[locale]/(dashboard)/admin/drivers/[id]/page.tsx` (Driver details client page)

## Translation Tasks

- [x] Create message type file `shared/messages/types/dashboard/admin/drivers.ts`
- [x] Register message types in `shared/messages/types/message.ts`
- [x] Create English messages file `shared/messages/en/dashboard/admin/drivers.ts`
- [x] Create Arabic messages file `shared/messages/ar/dashboard/admin/drivers.ts`
- [x] Register translation files in `shared/messages/en.ts` and `shared/messages/ar.ts`
- [x] Translate drivers listing table `app/[locale]/(dashboard)/admin/drivers/AdminDriversClient.tsx`
- [x] Fix next-intl namespace path in `app/[locale]/(dashboard)/admin/_components/UserDetailsView.tsx`
- [x] Verify driver details page `app/[locale]/(dashboard)/admin/drivers/[id]/page.tsx` uses next-intl translations
