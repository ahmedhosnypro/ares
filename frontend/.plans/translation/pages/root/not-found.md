# Not Found Translation Tasks

## Page Overview

- Route: `/not-found`
- Source: app/[locale]/not-found.tsx

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

None - single file page component.

## Component Discovery

- `frontend/app/[locale]/not-found.tsx` - Client component with `useTheme()`

## Hardcoded Strings Found

| String                                                                                                       | Message Key      |
| ------------------------------------------------------------------------------------------------------------ | ---------------- |
| `404`                                                                                                        | `errorCode`      |
| `Page not found`                                                                                             | `title`          |
| `The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.` | `description`    |
| `Back to Home`                                                                                               | `backToHome`     |
| `Search Vehicles`                                                                                            | `searchVehicles` |

## Translation Tasks

- [x] Create type file: `shared/messages/types/root/not-found.ts`
- [x] Create English translation: `shared/messages/en/root/not-found.ts`
- [x] Create Arabic translation: `shared/messages/ar/root/not-found.ts`
- [x] Update `shared/messages/types/message.ts` - Added `NotFoundLabels`, `RootPagesSchema`, `rootPages` to `MessageSchema`
- [x] Update `shared/messages/en.ts` - Added import and `rootPages` object
- [x] Update `shared/messages/ar.ts` - Added import and `rootPages` object
- [x] Update component - Replaced all hardcoded strings with `useTranslations("rootPages.notFound")`
- [x] Review - No hardcoded strings remain
