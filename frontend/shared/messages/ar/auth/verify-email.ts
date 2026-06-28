import type { VerifyEmailLabels } from "../../types/auth/verify-email";

const verifyEmail: VerifyEmailLabels = {
  loadingTitle: "جاري التحقق من بريدك الإلكتروني...",
  loadingMessage: "يرجى الانتظار لحظة أثناء التحقق من حسابك.",
  successTitle: "تم التحقق من البريد الإلكتروني!",
  successMessage: "تم التحقق من عنوان بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول إلى حسابك.",
  continueToLogin: "متابعة تسجيل الدخول",
  errorTitle: "فشل التحقق",
  backToLogin: "العودة لتسجيل الدخول",
  registerNewAccount: "تسجيل حساب جديد",
  invalidLink: "رابط التحقق غير صالح. معرّف المستخدم أو الرمز مفقود.",
  verificationFailed: "فشل التحقق من البريد الإلكتروني. قد يكون الرابط منتهي الصلاحية أو غير صالح.",
  unexpectedError: "حدث خطأ غير متوقع أثناء الاتصال بالخادم.",
};

export default verifyEmail;
