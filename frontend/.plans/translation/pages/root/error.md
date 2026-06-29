# Error Page Translation Tasks

## Page Overview

- Route: `/error`
- Source: app/[locale]/error.tsx
- Component type: Client ("use client")

## Translation Status

- [x] Not started
- [x] In progress
- [ ] Completed

## Shared Components

None - single file component, no \_components/ directory

## Component Discovery

- `app/[locale]/error.tsx` - GlobalError (client component)

## Hardcoded Strings Found

| String                                                                                                                     | Key            | Notes                        |
| -------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------- |
| "Something went wrong"                                                                                                     | `title`        | h3 heading                   |
| "An unexpected error occurred while processing your request. Our team has been notified and we are working to resolve it." | `description`  | body text                    |
| "Try Again"                                                                                                                | `tryAgain`     | button text                  |
| "Go to Homepage"                                                                                                           | `goToHomepage` | button text                  |
| "Error ID: "                                                                                                               | `errorId`      | caption prefix before digest |

## Translation Tasks

- [x] Create type file: `shared/messages/types/root/error.ts`
- [x] Create English translation: `shared/messages/en/root/error.ts`
- [x] Create Arabic translation: `shared/messages/ar/root/error.ts`
- [x] Update `shared/messages/types/message.ts` - add ErrorPageLabels import, add to RootPagesSchema
- [x] Update `shared/messages/en.ts` - add rootPages.error
- [x] Update `shared/messages/ar.ts` - add rootPages.error
- [x] Update component: replace hardcoded strings with `useTranslations("rootPages.error")`
- [ ] Lint and verify
