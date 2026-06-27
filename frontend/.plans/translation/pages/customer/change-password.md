# Change Password Translation Tasks

## Page Overview

- Route: `/(customer)/change-password`
- Source: app/[locale]/(customer)/change-password/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

- `components/profile/ChangePasswordForm.tsx` — primary component (reused in SharedProfileContainer)

## Component Discovery

### ChangePasswordForm (`components/profile/ChangePasswordForm.tsx`)

Previously used `customer.accountProfile.security.*` namespace. Refactored to use dedicated `customer.changePassword` namespace with localized Zod schema.

### page.tsx (`app/[locale]/(customer)/change-password/page.tsx`)

Server component using `getTranslations("customer.changePassword")` for sign-in required state.

## Translation Tasks

- [x] Create `ChangePasswordLabels` type at `shared/messages/types/customer/change-password.ts`
- [x] Register type in `shared/messages/types/message.ts` (`CustomerSchema.changePassword`)
- [x] Create English translation at `shared/messages/en/customer/change-password.ts`
- [x] Create Arabic translation at `shared/messages/ar/customer/change-password.ts`
- [x] Import into root `en.ts` and `ar.ts`
- [x] Refactor `ChangePasswordForm.tsx` to use `customer.changePassword` namespace with localized `createChangePasswordSchema`
- [x] Create `page.tsx` at `app/[locale]/(customer)/change-password/`
- [x] TypeScript check passes
- [x] Lint passes (no new errors)
