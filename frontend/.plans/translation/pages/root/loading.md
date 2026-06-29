# Loading Page Translation Tasks

## Page Overview

- Route: `/loading`
- Source: app/[locale]/loading.tsx

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

- `PopularDestinationsSkeleton` — skeleton-only, no translatable strings
- `SearchResultsSkeleton` (search loading) — skeleton-only, no translatable strings
- `VehicleCardSkeleton` (search loading) — skeleton-only, no translatable strings

## Component Discovery

| Component                   | File                                                           | Hardcoded Strings    |
| --------------------------- | -------------------------------------------------------------- | -------------------- |
| HomeLoading                 | app/[locale]/loading.tsx                                       | None (skeleton only) |
| PopularDestinationsSkeleton | app/[locale]/\_components/home/PopularDestinationsSkeleton.tsx | None (skeleton only) |
| SearchLoading               | app/[locale]/(public)/search/loading.tsx                       | None (skeleton only) |
| SearchResultsSkeleton       | app/[locale]/(public)/search/SearchResultsSkeleton.tsx         | None (skeleton only) |
| VehicleCardSkeleton         | app/[locale]/(public)/search/VehicleCardSkeleton.tsx           | None (skeleton only) |

## Translation Tasks

- [x] Created type file: `shared/messages/types/root/loading.ts` (LoadingPageLabels = Pick<CommonLabels, "loading">)
- [x] Created English translation: `shared/messages/en/root/loading.ts`
- [x] Created Arabic translation: `shared/messages/ar/root/loading.ts`
- [x] Updated `shared/messages/types/message.ts` — added LoadingPageLabels import/export and `loading` to RootPagesSchema
- [x] Updated `shared/messages/en.ts` — added loadingPage import and rootPages.loading entry
- [x] Updated `shared/messages/ar.ts` — added loadingPage import and rootPages.loading entry
- [x] Updated `app/[locale]/loading.tsx` — added screen reader accessible label using `useTranslations("rootPages.loading")`

## Notes

The loading page is a skeleton-only component (MUI `<Skeleton>` placeholders). There are zero visual text strings. A visually hidden accessible label was added for screen readers using the `loading` key from `CommonLabels`.
