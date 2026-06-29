import type { EditCountryLabels } from "../../../../../types/dashboard/admin/countries/_id/edit";

const edit: EditCountryLabels = {
  title: "تعديل الدولة",
  backButtonTooltip: "العودة إلى الدول",
  cardTitle: "تفاصيل ترجمة الدولة",
  form: {
    fields: {
      nameEn: "اسم الدولة (بالإنكليزية)",
      nameAr: "اسم الدولة (بالعربية)",
      placeholderEn: "مثال: Egypt, Saudi Arabia",
      placeholderAr: "مثال: مصر، المملكة العربية السعودية",
    },
    validation: {
      nameEnRequired: "اسم الدولة بالإنكليزية مطلوب.",
      nameArRequired: "اسم الدولة بالعربية مطلوب.",
      nameUniqueError: "يجب أن يكون اسم الدولة فريداً. هذا الاسم مستخدم بالفعل.",
    },
    buttons: {
      cancel: "إلغاء",
      submit: "حفظ التغييرات",
      submitting: "جاري الحفظ...",
    },
  },
  alerts: {
    loadFailed: "فشل في تحميل تفاصيل الدولة.",
    notFound: "الدولة غير موجودة.",
    success: "تم تحديث الدولة بنجاح.",
    error: "فشل في تحديث الدولة.",
  },
};

export default edit;
