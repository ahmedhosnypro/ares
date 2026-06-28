# Verify Email Translation Tasks

## Page Overview

- Route: `/(auth)/verify-email`
- Source: app/[locale]/(auth)/verify-email/

## Translation Status

- [ ] Not started
- [x] In progress
- [x] Completed

## Shared Components

None — page is self-contained.

## Component Discovery

| Component         | File                                                     | Status                                                  |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| VerifyEmailPage   | `app/[locale]/(auth)/verify-email/page.tsx`              | No changes needed (server component, passes props only) |
| VerifyEmailClient | `app/[locale]/(auth)/verify-email/VerifyEmailClient.tsx` | Translated                                              |

## Translation Keys

| Key                | English                                                                                | Arabic                                                                        |
| ------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| loadingTitle       | Verifying your email...                                                                | جاري التحقق من بريدك الإلكتروني...                                            |
| loadingMessage     | Please wait a moment while we verify your account.                                     | يرجى الانتظار لحظة أثناء التحقق من حسابك.                                     |
| successTitle       | Email Verified!                                                                        | تم التحقق من البريد الإلكتروني!                                               |
| successMessage     | Your email address has been successfully verified. You can now log in to your account. | تم التحقق من عنوان بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك. |
| continueToLogin    | Continue to Login                                                                      | متابعة تسجيل الدخول                                                           |
| errorTitle         | Verification Failed                                                                    | فشل التحقق                                                                    |
| backToLogin        | Back to Login                                                                          | العودة لتسجيل الدخول                                                          |
| registerNewAccount | Register a new account                                                                 | تسجيل حساب جديد                                                               |
| invalidLink        | Invalid verification link. Missing user ID or token.                                   | رابط التحقق غير صالح. معرّف المستخدم أو الرمز مفقود.                          |
| verificationFailed | Failed to verify email. The link may be expired or invalid.                            | فشل التحقق من البريد الإلكتروني. قد يكون الرابط منتهي الصلاحية أو غير صالح.   |
| unexpectedError    | An unexpected error occurred while communicating with the server.                      | حدث خطأ غير متوقع أثناء الاتصال بالخادم.                                      |

## Translation Tasks

- [x] Update `types/auth/verify-email.ts` with full VerifyEmailLabels type
- [x] Update `en/auth/verify-email.ts` with full English translations
- [x] Update `ar/auth/verify-email.ts` with full Arabic translations
- [x] Update `VerifyEmailClient.tsx` to use `useTranslations("authPages.verifyEmail")`
- [x] Handle initial error state with `errorKey` pattern (key stored in state, translated in render)
- [x] Run tsgo and lint checks
