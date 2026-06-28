# Sign Up Translation Tasks

## Page Overview

- Route: `/(auth)/sign-up`
- Source: app/[locale]/(auth)/sign-up/

## Translation Status

- [ ] Not started
- [x] In progress
- [ ] Completed

## Shared Components

- GoogleSignInButton: already uses `useTranslations("authPages.googleSignIn")` internally (handled by sign-in agent)
- RoleSelector: uses `useTranslations("authPages.signup")` internally

## Component Discovery

### page.tsx

- Server component, no hardcoded strings visible to user

### SignUpForm.tsx (client component)

- `SignUpHeader` sub-component: brandName, title, subtitle
- `SuccessView` sub-component: successTitle, successMessage (with {firstName} interpolation), goToSignIn
- `RegistrationForm` sub-component: field labels, toggle aria-labels, checkbox labels/links, createAccountButton, password strength labels
- Decorative panel: decorativeTitle, decorativeSubtitle, carImageAlt
- Error handling: errorTitle, emailAlreadyRegistered, tooManyAttempts, invalidDetails, unexpectedError
- Validation: confirmPasswordRequired, passwordsDoNotMatch
- Footer: hasAccount, signInLink, orDivider

### RoleSelector.tsx (client component)

- registerAs (legend), accountTypeAria (radiogroup aria-label)
- roleCustomerTitle/Desc, roleSupplierTitle/Desc, roleDriverTitle/Desc

## Translation Tasks

- [x] Update `types/auth/signup.ts` with full SignUpPageLabels type (40 keys)
- [x] Update `en/auth/signup.ts` with full English translations
- [x] Update `ar/auth/signup.ts` with full Arabic translations
- [x] Update `SignUpForm.tsx` to use `useTranslations("authPages.signup")`
  - [x] Added `useTranslations` import and hook call
  - [x] Replaced all hardcoded strings with `t()` calls
  - [x] Restructured `getPasswordStrength` to return score+color only (labels via translation)
  - [x] Added `passwordStrengthLabel` computed from score + translations
  - [x] Added `ErrorMessages` interface for `handleRegisterResponse`
  - [x] Updated `performRegistration` and `handleRegisterResponse` to accept error messages
  - [x] Passed `t` as prop to `SignUpHeader`, `SuccessView`, `RegistrationForm`
  - [x] Replaced nested ternary with IIFE for `googleRole`
- [x] Update `RoleSelector.tsx` to use `useTranslations("authPages.signup")`
  - [x] Replaced static OPTIONS title/description with translation keys
  - [x] Used `t()` for registerAs, accountTypeAria, role titles, role descriptions
