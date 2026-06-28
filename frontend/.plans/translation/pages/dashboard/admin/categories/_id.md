# Category Detail Translation Tasks

## Page Overview

- Route: `/(dashboard)/admin/categories/[id]`
- Source: app/[locale]/(dashboard)/admin/categories/[id]/

## Translation Status

- [ ] Not started
- [ ] In progress
- [x] Completed

## Shared Components

- `PromotionManager.tsx` (under `_components/`)

## Component Discovery

- `CategoryDetailsPage` (in `[id]/page.tsx`): displays category details, stats cards, and list of assigned vehicles.
- `PromotionManager` (in `_components/PromotionManager.tsx`): lists, adds, edits, and deletes promotional offers for the category.

## Translation Tasks

- [x] Create message types schema in `shared/messages/types/dashboard/admin/categories/detail.ts`
- [x] Implement English translations in `shared/messages/en/dashboard/admin/categories/detail.ts`
- [x] Implement Arabic translations in `shared/messages/ar/dashboard/admin/categories/detail.ts`
- [x] Register new category details translations in `types/message.ts`, `en.ts`, and `ar.ts`
- [x] Update `categories/[id]/page.tsx` to use next-intl translations
- [x] Update `PromotionManager.tsx` to use next-intl translations
