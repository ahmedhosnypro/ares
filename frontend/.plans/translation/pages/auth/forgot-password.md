# Forgot Password Translation Tasks

## Page Overview

- Route: `/(auth)/forgot-password`
- Source: app/[locale]/(auth)/forgot-password/

## Translation Status

- [x] Not started
- [x] In progress
- [x] Completed

## Shared Components

- `shared/messages/types/auth/forgot-password.ts` — ForgotPasswordLabels type (17 keys)
- `shared/messages/en/auth/forgot-password.ts` — English translations
- `shared/messages/ar/auth/forgot-password.ts` — Arabic translations

## Component Discovery

- `app/[locale]/(auth)/forgot-password/page.tsx` — Simple wrapper, no changes needed
- `app/[locale]/(auth)/forgot-password/ForgotPasswordForm.tsx` — Main form component, 17 hardcoded strings replaced

## Translation Tasks

- [x] Update `types/auth/forgot-password.ts` with full ForgotPasswordLabels type
- [x] Update `en/auth/forgot-password.ts` with full English translations
- [x] Update `ar/auth/forgot-password.ts` with full Arabic translations
- [x] Update `ForgotPasswordForm.tsx` to use `useTranslations("authPages.forgotPassword")`
- [x] Replace all 17 hardcoded strings with translation keys
- [x] Handle ICU interpolation for `successMessage` with `{email}` variable
- [x] TypeScript check passes (no new errors)
- [x] Lint check passes (no new errors)

## Message Keys

| Key                | EN                                                                                                 | AR                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| title              | Reset Password                                                                                     | إعادة تعيين كلمة المرور                                                                                            |
| subtitle           | Enter your email address and we'll send you a link to reset your password.                         | أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.                                             |
| emailLabel         | Email Address                                                                                      | عنوان البريد الإلكتروني                                                                                            |
| sendResetLink      | Send Reset Link                                                                                    | إرسال رابط إعادة التعيين                                                                                           |
| successTitle       | Check Your Email                                                                                   | تحقق من بريدك الإلكتروني                                                                                           |
| successMessage     | If an account exists for {email}, we have sent a password reset link. Please check your inbox.     | إذا كان هناك حساب مرتبط بـ {email}، فقد أرسلنا رابط إعادة تعيين كلمة المرور. يرجى التحقق من صندوق الوارد الخاص بك. |
| returnToSignIn     | Return to Sign In                                                                                  | العودة لتسجيل الدخول                                                                                               |
| rememberPassword   | Remember your password?                                                                            | تتذكر كلمة المرور؟                                                                                                 |
| signInLink         | Sign in                                                                                            | تسجيل الدخول                                                                                                       |
| errorTitle         | Error                                                                                              | خطأ                                                                                                                |
| resetFailed        | Failed to request password reset. Please try again.                                                | فشل طلب إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.                                                           |
| unexpectedError    | An unexpected error occurred. Please try again later.                                              | حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.                                                                  |
| invalidEmail       | Invalid email                                                                                      | بريد إلكتروني غير صالح                                                                                             |
| logoAlt            | Ares Logo                                                                                          | شعار أريس                                                                                                          |
| carImageAlt        | Luxury Car Interior                                                                                | داخلية سيارة فاخرة                                                                                                 |
| decorativeTitle    | Seamless Recovery                                                                                  | استعادة سلسة                                                                                                       |
| decorativeSubtitle | Don't worry, getting back on the road is just a click away. Let's get you signed back in securely. | لا تقلق، العودة إلى الطريق على بعد نقرة واحدة. دعنا نساعدك على تسجيل الدخول بأمان.                                 |
