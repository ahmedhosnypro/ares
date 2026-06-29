# Cookie Policy Translation Tasks

## Page Overview

- Route: `/(public)/cookie-policy`
- Source: app/[locale]/(public)/cookie-policy/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

No \_components/ directory found.

## Component Discovery

- `page.tsx` - Server component with hardcoded "Cookie Policy" title

## Hardcoded Strings Found

| File     | String                | Key         |
| -------- | --------------------- | ----------- |
| page.tsx | "Cookie Policy"       | title       |
| page.tsx | (empty state implied) | lastUpdated |
| page.tsx | (empty state implied) | emptyState  |

## Translation Tasks

- [x] Create type file: `shared/messages/types/public/cookie-policy.ts`
- [x] Create English translation: `shared/messages/en/public/cookie-policy.ts`
- [x] Create Arabic translation: `shared/messages/ar/public/cookie-policy.ts`
- [x] Update root type file: `shared/messages/types/message.ts`
- [x] Update root en.ts: `shared/messages/en.ts`
- [x] Update root ar.ts: `shared/messages/ar.ts`
- [x] Update component: `app/[locale]/(public)/cookie-policy/page.tsx`

## Message Keys

```ts
CookiePolicyLabels = {
  readonly title: string;
  readonly lastUpdated: string;
  readonly emptyState: string;
}
```
