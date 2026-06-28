# Reset Password Translation Tasks

## Page Overview

- Route: `/(auth)/reset-password`
- Source: app/[locale]/(auth)/reset-password/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

- Type: `frontend/shared/messages/types/auth/reset-password.ts` — 32 keys
- English: `frontend/shared/messages/en/auth/reset-password.ts`
- Arabic: `frontend/shared/messages/ar/auth/reset-password.ts`

## Component Discovery

| File                      | Type                                                         |
| ------------------------- | ------------------------------------------------------------ |
| `page.tsx`                | Server component — no translation needed (passes props only) |
| `ResetPasswordClient.tsx` | Client component — all UI strings translated                 |

## Translation Tasks

- [x] Update `ResetPasswordLabels` type with full 32-key definition
- [x] Add English translations (32 keys)
- [x] Add Arabic translations (32 keys)
- [x] Add `useTranslations("authPages.resetPassword")` hook
- [x] Replace all hardcoded strings with `t()` calls
- [x] Move Zod schema into `createResetPasswordSchema(t)` factory for translated validation messages
- [x] Move `getPasswordStrength` to accept `t` parameter for translated labels
- [x] Wrap schema with `useMemo` to avoid recreation each render
- [x] TypeScript and lint checks pass (no new errors)
