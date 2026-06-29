# Edit Country Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/countries/[id]/edit`
- Source: app/[locale]/(dashboard)/admin/countries/[id]/edit/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `EditCountryClient.tsx` (under `_components/`)

## Component Discovery

- `AdminEditCountryPage` (in `edit/page.tsx`): Wrapper page component resolving country ID route parameter.
- `EditCountryClient` (in `_components/EditCountryClient.tsx`): Form for editing country localization name details in English & Arabic. Pre-populates original names, and validates uniqueness upon change.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/countries/_id/edit.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/countries/_id/edit.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/countries/_id/edit.ts`
- [x] Register edit country translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Create `EditCountryClient.tsx` using next-intl and hook up localization values
