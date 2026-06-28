import type { GoogleSignInLabels } from "../../types/auth/google-signin";

const googleSignIn: GoogleSignInLabels = {
  defaultLabel: "المتابعة مع Google",
  chooseRole: "اختر دورك",
  roleDialogDescription:
    "اختر الدور الذي تريده قبل المتابعة مع Google. سنستخدمه فقط إذا كانت هذه أول مرة تسجل الدخول فيها.",
  cancel: "إلغاء",
  confirmGoogle: "المتابعة مع Google",
  roleCustomerLabel: "عميل",
  roleCustomerDesc: "استأجر سيارات لرحلات شخصية أو تجارية.",
  roleSupplierLabel: "مورد",
  roleSupplierDesc: "أدر واعرض أسطولك من سيارات الإيجار.",
  roleDriverLabel: "سائق",
  roleDriverDesc: "قدّم خدمات القيادة للعملاء.",
  noCredential: "لم ترجع Google بيانات اعتماد. يرجى المحاولة مرة أخرى.",
  unexpectedError: "حدث خطأ غير متوقع أثناء تسجيل الدخول عبر Google",
  stillLoading: "لا يزار تسجيل الدخول عبر Google قيد التحميل. يرجى المحاولة مرة أخرى بعد قليل.",
  cancelled: "تم إلغاء تسجيل الدخول عبر Google أو حظره المتصفح. يرجى المحاولة مرة أخرى.",
  loadFailed: "فشل تحميل تسجيل الدخول عبر Google. يرجى التحقق من اتصالك.",
};

export default googleSignIn;
