import type { ChangePasswordLabels } from "../../types/customer/change-password";

const changePassword: ChangePasswordLabels = {
  title: "تغيير كلمة المرور",
  signInRequired: {
    title: "تسجيل الدخول مطلوب",
    message: "يرجى تسجيل الدخول لتغيير كلمة المرور.",
    signInButton: "تسجيل الدخول",
  },
  currentPassword: "كلمة المرور الحالية",
  newPassword: "كلمة المرور الجديدة",
  confirmNewPassword: "تأكيد كلمة المرور الجديدة",
  toggleCurrentPasswordAria: "تبديل ظهور كلمة المرور الحالية",
  toggleNewPasswordAria: "تبديل ظهور كلمة المرور الجديدة",
  toggleConfirmPasswordAria: "تبديل ظهور تأكيد كلمة المرور",
  changeButton: "تغيير كلمة المرور",
  changing: "جارٍ التغيير...",
  changeSuccess: "تم تغيير كلمة المرور بنجاح.",
  changeFailed: "فشل تغيير كلمة المرور.",
  passwordStrength: {
    tooShort: "قصيرة جداً",
    weak: "ضعيفة",
    fair: "مقبولة",
    good: "جيدة",
    strong: "قوية",
  },
  validation: {
    currentPasswordRequired: "كلمة المرور الحالية مطلوبة",
    passwordMinLength: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
    passwordUppercase: "يجب أن تحتوي على حرف كبير واحد على الأقل",
    passwordLowercase: "يجب أن تحتوي على حرف صغير واحد على الأقل",
    passwordDigit: "يجب أن تحتوي على رقم واحد على الأقل",
    passwordSpecialChar: "يجب أن تحتوي على حرف خاص واحد على الأقل",
    confirmPasswordRequired: "يرجى تأكيد كلمة المرور الجديدة",
    passwordsDoNotMatch: "كلمات المرور غير متطابقة",
  },
};

export default changePassword;
