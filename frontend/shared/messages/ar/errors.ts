import type { ErrorsLabels } from "../types/errors";

const errors: ErrorsLabels = {
  unauthorized: "وصول غير مصرح به",
  notFound: "المورد غير موجود",
  serverError: "حدث خطأ في الخادم",
  networkError: "خطأ في الاتصال بالشبكة",
  validationError: "خطأ في التحقق",
  requiredField: "هذا الحقل مطلوب",
  invalidEmail: "عنوان بريد إلكتروني غير صالح",
  passwordMismatch: "كلمات المرور غير متطابقة",
  sessionExpired: "انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.",
  accessDenied: "تم رفض الوصول",
};

export default errors;
