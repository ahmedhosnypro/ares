# Activate Account Translation Tasks

## Page Overview

- Route: `/(auth)/activate/[userId]/[token]`
- Source: app/[locale]/(auth)/activate/[userId]/[token]/page.tsx
- Server component using `getTranslations`

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Message Keys

| Key     | English          | Arabic       |
| ------- | ---------------- | ------------ |
| `title` | Activate Account | تفعيل الحساب |

## Translation Tasks

- [x] Update `types/auth/activate.ts` with `ActivateLabels` type
- [x] Update `en/auth/activate.ts` with English translations
- [x] Update `ar/auth/activate.ts` with Arabic translations
- [x] Update page component to use `getTranslations("authPages.activate")`
- [x] Fix `types/message.ts` duplicate `MessageSchema` and missing imports
- [x] Verify with `tsgo` and `lint`
