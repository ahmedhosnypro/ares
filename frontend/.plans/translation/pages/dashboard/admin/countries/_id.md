# Country Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/countries/[id]`
- Source: app/[locale]/(dashboard)/admin/countries/[id]/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `CountryDetailsClient.tsx` (under `_components/`)

## Component Discovery

- `AdminCountryDetailPage` (in `[id]/page.tsx`): Wrapper page component resolving country ID route parameter.
- `CountryDetailsClient` (in `_components/CountryDetailsClient.tsx`): Client component displaying country Details, looking up country flag from FlagCDN, and providing Edit/Delete action buttons.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/countries/_id/details.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/countries/_id/details.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/countries/_id/details.ts`
- [x] Register country details translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Update `page.tsx` and create `CountryDetailsClient.tsx` using next-intl
