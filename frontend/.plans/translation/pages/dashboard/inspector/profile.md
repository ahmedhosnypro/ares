# Inspector Profile Translation Tasks

## Page Overview

- Route: `/(dashboard)/inspector/profile`
- Source: app/[locale]/(dashboard)/inspector/profile/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

- SharedProfileContainer.tsx (from components/profile) — already uses `useTranslations("customer.accountProfile")`
- ProfileCard.tsx (from components/profile) — no user-facing strings

## Component Discovery

- page.tsx (main component)
  - Hardcoded strings in JSX:
    - "Employee Credentials" (section heading)
    - "Assigned Employee Roles" (label for roles list)

## Translation Tasks

- [x] Create type file for inspector profile translations
- [x] Register type in message schema (message.ts)
- [x] Create English translation file
- [x] Create Arabic translation file
- [x] Update root translation files (en.ts, ar.ts)
- [x] Replace hardcoded strings in page.tsx with useTranslations
- [x] Verify translations in UI
