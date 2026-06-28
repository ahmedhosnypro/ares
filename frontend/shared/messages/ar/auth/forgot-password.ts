import type { ForgotPasswordLabels } from "../../types/auth/forgot-password";

const forgotPassword: ForgotPasswordLabels = {
  title: "إعادة تعيين كلمة المرور",
  subtitle: "أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
  emailLabel: "عنوان البريد الإلكتروني",
  sendResetLink: "إرسال رابط إعادة التعيين",
  successTitle: "تحقق من بريدك الإلكتروني",
  successMessage:
    "إذا كان هناك حساب مرتبط بـ {email}، فقد أرسلنا رابط إعادة تعيين كلمة المرور. يرجى التحقق من صندوق الوارد الخاص بك.",
  returnToSignIn: "العودة لتسجيل الدخول",
  rememberPassword: "تتذكر كلمة المرور؟",
  signInLink: "تسجيل الدخول",
  errorTitle: "خطأ",
  resetFailed: "فشل طلب إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
  unexpectedError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.",
  invalidEmail: "بريد إلكتروني غير صالح",
  logoAlt: "شعار أريس",
  carImageAlt: "داخلية سيارة فاخرة",
  decorativeTitle: "استعادة سلسة",
  decorativeSubtitle: "لا تقلق، العودة إلى الطريق على بعد نقرة واحدة. دعنا نساعدك على تسجيل الدخول بأمان.",
};

export default forgotPassword;
