import type { AuthLabels } from "../types/auth";

const auth: AuthLabels = {
  login: {
    title: "تسجيل الدخول",
    subtitle: "الوصول إلى حسابك",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟",
    signIn: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "يرجى إدخال بريد إلكتروني صالح",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMinLength: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    loginSuccess: "تم تسجيل الدخول بنجاح!",
    loginError: "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.",
    invalidCredentials: "بريد إلكتروني أو كلمة مرور غير صحيحة",
    tryAgain: "حاول مرة أخرى",
  },
  signup: {
    title: "إنشاء حساب",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    createAccount: "إنشاء الحساب",
    hasAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
  },
  logout: "تسجيل الخروج",
};

export default auth;
