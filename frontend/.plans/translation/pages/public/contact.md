# Contact Translation Tasks

## Page Overview

- Route: `/(public)/contact`
- Source: app/[locale]/(public)/contact/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Component Discovery

- `page.tsx` - Server component, single hardcoded string "Contact" in h1

## Hardcoded Strings Found

- `page.tsx:4` - "Contact" (h1 text)

## Message Keys

| Key   | English | Arabic   |
| ----- | ------- | -------- |
| title | Contact | اتصل بنا |

## Translation Tasks

- [x] Create type file: `shared/messages/types/public/contact.ts` (ContactLabels)
- [x] Create English translation: `shared/messages/en/public/contact.ts`
- [x] Create Arabic translation: `shared/messages/ar/public/contact.ts`
- [x] Update root type file: `shared/messages/types/message.ts` (import + export + PublicPagesSchema)
- [x] Update root en.ts: import + add to publicPages
- [x] Update root ar.ts: import + add to publicPages
- [x] Update component: `page.tsx` - replaced "Contact" with `t("title")`
- [x] Verify linting passes
