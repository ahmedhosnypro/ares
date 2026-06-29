# FAQ Translation Tasks

## Page Overview

- Route: `/(public)/faq`
- Source: app/[locale]/(public)/faq/page.tsx
- Component type: Server component (async, getTranslations)

## Translation Status

- [x] Completed

## Component Discovery

| Component | File     | Type   | Strings       |
| --------- | -------- | ------ | ------------- |
| FaqPage   | page.tsx | Server | title ("FAQ") |

## Hardcoded Strings

| Component | Key   | Original |
| --------- | ----- | -------- |
| FaqPage   | title | "FAQ"    |

## Translation Tasks

- [x] Create type file `shared/messages/types/public/faq.ts` (FaqLabels)
- [x] Create English translation `shared/messages/en/public/faq.ts`
- [x] Create Arabic translation `shared/messages/ar/public/faq.ts`
- [x] Register type in `shared/messages/types/message.ts` (PublicPagesSchema)
- [x] Update `shared/messages/en.ts` (import + add to publicPages)
- [x] Update `shared/messages/ar.ts` (import + add to publicPages)
- [x] Update page.tsx to use `getTranslations("publicPages.faq")`
- [x] Lint verification
