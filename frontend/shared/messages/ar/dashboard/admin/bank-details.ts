import type { BankDetailsLabels } from "../../../types/dashboard/admin/bank-details";

const bankDetails: BankDetailsLabels = {
  title: "تفاصيل الحساب البنكي",
  subtitle:
    "إدارة الحسابات البنكية الرسمية التي تظهر للعملاء عند اختيار طرق الدفع غير المتصلة بالإنترنت أو التحويل البنكي.",
  form: {
    sectionTitle: "إعدادات تفاصيل الحساب البنكي",
    bankName: "اسم البنك",
    accountHolder: "اسم صاحب الحساب",
    iban: "رقم الآيبان (IBAN)",
    swiftBic: "رمز السويفت (SWIFT / BIC)",
    accountNumber: "رقم الحساب",
    routingNumber: "رقم التوجيه (Routing Number)",
    notes: "تعليمات إضافية",
    saveButton: "حفظ تفاصيل البنك",
    saving: "جاري حفظ التغييرات...",
    reset: "إعادة تعيين النموذج",
  },
  preview: {
    title: "معاينة عرض العميل",
    description: "هذه معاينة لكيفية ظهور تعليمات الدفع للعملاء في صفحة الدفع الخاصة بهم.",
    paymentMethod: "تحويل بنكي (دفع يدوي)",
    instruction:
      "يرجى تحويل إجمالي مبلغ الحجز إلى الحساب البنكي التالي. ثم قم بإرسال إيصال التحويل للتحقق من الحجز وتأكيده.",
    importantNotes: "ملاحظات هامة:",
  },
  alerts: {
    success: "تم حفظ تفاصيل البنك ونشرها بنجاح.",
    error: "يرجى تصحيح حقول النموذج قبل الحفظ.",
    loading: "جاري حفظ التفاصيل في الخادم...",
    reset: "تم إعادة تعيين النموذج إلى التفاصيل المنشورة.",
  },
  validation: {
    required: "هذا الحقل مطلوب.",
    invalidIban: "صيغة رقم الآيبان غير صالحة.",
    invalidSwift: "صيغة رمز السويفت غير صالحة.",
  },
};

export default bankDetails;
