# Create Country Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/countries/create`
- Source: app/[locale]/(dashboard)/admin/countries/create/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

None

## Component Discovery

- `app/[locale]/(dashboard)/admin/countries/create/page.tsx`

## Translation Tasks

- [x] Register Types in `shared/messages/types/dashboard/admin/countries/create.ts` and `shared/messages/types/message.ts`
- [x] Create English translations in `shared/messages/en/dashboard/admin/countries/create.ts` and register in `en.ts`
- [x] Create Arabic translations in `shared/messages/ar/dashboard/admin/countries/create.ts` and register in `ar.ts`
- [x] Create API helper functions in `api-clients/countries/countries.ts` for country validation and creation
- [x] Implement the creation form inside `app/[locale]/(dashboard)/admin/countries/create/page.tsx` utilizing next-intl translations
