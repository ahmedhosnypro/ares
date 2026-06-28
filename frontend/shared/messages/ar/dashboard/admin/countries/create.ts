import type { CreateCountryLabels } from "../../../../types/dashboard/admin/countries/create";

const createCountry: CreateCountryLabels = {
  title: "إنشاء دولة جديدة",
  backButtonTooltip: "الرجوع إلى الدول",
  cardTitle: "معلومات الدولة",
  form: {
    fields: {
      nameEn: "اسم الدولة (بالإنجليزي)",
      nameAr: "اسم الدولة (بالعربي)",
      placeholderEn: "e.g., Egypt, United Arab Emirates, Saudi Arabia",
      placeholderAr: "مثال: مصر، الإمارات العربية المتحدة، المملكة العربية السعودية",
    },
    validation: {
      nameEnRequired: "اسم الدولة باللغة الإنجليزية مطلوب.",
      nameArRequired: "اسم الدولة باللغة العربية مطلوب.",
      nameUniqueError: "يجب أن يكون اسم الدولة فريداً. هذا الاسم مستخدم بالفعل.",
    },
    buttons: {
      cancel: "إلغاء",
      submit: "إنشاء الدولة",
      submitting: "جاري الإنشاء...",
    },
  },
  alerts: {
    success: "تم إنشاء الدولة بنجاح.",
    error: "فشل في إنشاء الدولة. يرجى المحاولة مرة أخرى.",
  },
};

export default createCountry;
