# Categories Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/categories`
- Source: app/[locale]/(dashboard)/admin/categories/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `CategoryForm.tsx` (under `_components/`)

## Component Discovery

- `AdminCategoriesPage` (in `page.tsx`): lists categories, handles deletion, and triggers create/edit modal.
- `CategoryForm` (in `_components/CategoryForm.tsx`): dialog for creating/editing categories and their promotional offers.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/categories.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/categories.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/categories.ts`
- [x] Register new categories translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Update `categories/page.tsx` to use next-intl translations
- [x] Update `CategoryForm.tsx` to use next-intl translations
