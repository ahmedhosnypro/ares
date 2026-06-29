# Search Translation Tasks

## Page Overview

- Route: `/(public)/search`
- Source: app/[locale]/(public)/search/

## Translation Status

- [x] Not started
- [x] In progress
- [ ] Completed

## Component Discovery

| Component                 | Type   | Translations Needed                         |
| ------------------------- | ------ | ------------------------------------------- |
| SearchPageContent.tsx     | Client | Yes - title, empty states, card labels      |
| SearchFormFilter.tsx      | Client | Yes - field labels, option labels           |
| VehicleAutocomplete.tsx   | Client | Yes - placeholder, no options text, caption |
| VehicleCardSkeleton.tsx   | Client | No - no user-facing text                    |
| SearchResultsSkeleton.tsx | Server | No - no user-facing text                    |
| loading.tsx               | Client | No - no user-facing text                    |
| page.tsx                  | Server | No - no user-facing text                    |

## Hardcoded Strings Found

### SearchPageContent.tsx

- "No image yet" (line 115)
- "Available now" / "Check availability" (line 119)
- "Available location" (line 147)
- "From" (line 161)
- "reviews" (line 198)
- "Demo city" (line 217)
- "View details →" (line 247)
- "Start your search" / "No cars matched that search" (line 277)
- "Select a pickup location above to see available vehicles." / "Try another location or stretch the dates a bit wider." (line 280-282)
- "Back to landing page" (line 297)
- "Newest first" / "Price: Low to High" / "Top Rated" (line 353-355)
- "Find the perfect car for your trip" (line 399)
- "Select location" (line 429)

### SearchFormFilter.tsx

- "All Categories" (line 51)
- "All Transmissions" / "Automatic" / "Manual" (line 56-59)
- "Sort: Default" / "Newest first" / "Price: Low to High" / "Top Rated" (line 62-66)
- "Pickup location" (line 137)
- "Select a location" (line 174)
- "Pickup date" (line 185)
- "Return date" (line 224)
- "Vehicle class" (line 267)
- "Transmission" (line 313)
- "Sort by" (line 359)

### VehicleAutocomplete.tsx

- "No vehicles found" / "Start typing to search..." (line 61)
- "Search by make, model, or location..." (line 65)
- "Available" / "${dailyRate}/day" (line 164)
- "Showing up to 10 vehicles matching your filters" (line 193)

## Translation Tasks

- [x] Create type file: shared/messages/types/public/search.ts
- [x] Create English translation: shared/messages/en/public/search.ts
- [x] Create Arabic translation: shared/messages/ar/public/search.ts
- [x] Update shared/messages/types/message.ts - add SearchLabels import and to PublicPagesSchema
- [x] Update shared/messages/en.ts - import and add search to publicPages
- [x] Update shared/messages/ar.ts - import and add search to publicPages
- [x] Update SearchPageContent.tsx - use useTranslations
- [x] Update SearchFormFilter.tsx - use useTranslations
- [x] Update VehicleAutocomplete.tsx - use useTranslations
- [ ] Final review of all components
- [ ] Run linting on all modified files
