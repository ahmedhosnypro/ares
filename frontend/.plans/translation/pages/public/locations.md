# Locations Translation Tasks

## Page Overview

- Route: `/(public)/locations`
- Source: app/[locale]/(public)/locations/page.tsx

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Component Discovery

| Component     | File     | Type                            |
| ------------- | -------- | ------------------------------- |
| LocationsPage | page.tsx | Client component (`use client`) |

## Hardcoded Strings Audit

| String                                                   | Location               | Key                       |
| -------------------------------------------------------- | ---------------------- | ------------------------- |
| "Explore Locations \| Ares Car Rental"                   | document.title         | pageTitle                 |
| "Our Locations"                                          | Typography heading     | heading                   |
| "Browse all our pickup and drop-off locations..."        | Typography subtitle    | subtitle                  |
| "Search locations by name..."                            | TextField placeholder  | searchPlaceholder         |
| "No locations found matching your search."               | Empty state title      | noResultsTitle            |
| "Try checking your spelling or search for another city." | Empty state suggestion | noResultsSuggestion       |
| "Location"                                               | Fallback city name     | fallbackCity              |
| "Egypt"                                                  | Fallback country name  | fallbackCountry           |
| "From ${startingPrice}/day"                              | Price badge            | priceBadge (ICU: {price}) |
| "+ vehicles available"                                   | Vehicle count          | vehiclesAvailable         |

## Translation Tasks

- [x] Create type file: `shared/messages/types/public/locations.ts`
- [x] Create English translation: `shared/messages/en/public/locations.ts`
- [x] Create Arabic translation: `shared/messages/ar/public/locations.ts`
- [x] Update root type: `shared/messages/types/message.ts` (import + export + PublicPagesSchema)
- [x] Update `en.ts`: import + add to publicPages
- [x] Update `ar.ts`: import + add to publicPages
- [x] Update component: `useTranslations("publicPages.locations")`
- [x] Lint verification
