# Sign In Translation Tasks

## Page Overview

- Route: `/(auth)/sign-in`
- Source: app/[locale]/(auth)/sign-in/

## Translation Status

- [ ] Not started
- [x] Completed

## Shared Components

- `GoogleSignInButton.tsx` — shared across sign-in and sign-up pages
  - Moved `GOOGLE_ROLES` array inside component to use `useTranslations` hook
  - Uses `authPages.googleSignIn` namespace
  - `label` prop now defaults to `t("defaultLabel")` instead of hardcoded string

## Component Discovery

- `page.tsx` (server component) — redirect logic only, no translatable strings
- `SignInForm.tsx` (client component) — 19 hardcoded strings → `authPages.signin` namespace
- `GoogleSignInButton.tsx` (client component) — 12 hardcoded strings → `authPages.googleSignIn` namespace

## Translation Tasks

- [x] Create `types/auth/signin.ts` with `SignInLabels` type (18 keys)
- [x] Create `types/auth/google-signin.ts` with `GoogleSignInLabels` type (16 keys)
- [x] Create placeholder types for signup, forgot-password, reset-password, activate, verify-email
- [x] Create `types/auth/index.ts` barrel file
- [x] Update `types/message.ts` with `AuthPagesSchema` and `authPages` namespace
- [x] Create `en/auth/signin.ts` with English translations
- [x] Create `en/auth/google-signin.ts` with English translations
- [x] Create placeholder English translations for other auth pages
- [x] Create `ar/auth/signin.ts` with Arabic translations
- [x] Create `ar/auth/google-signin.ts` with Arabic translations
- [x] Create placeholder Arabic translations for other auth pages
- [x] Update `en.ts` root to import auth page namespaces
- [x] Update `ar.ts` root to import auth page namespaces
- [x] Update `SignInForm.tsx` to use `useTranslations("authPages.signin")`
- [x] Update `GoogleSignInButton.tsx` to use `useTranslations("authPages.googleSignIn")`
