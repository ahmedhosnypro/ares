import type { CountryDetailsLabels } from "../../../../../types/dashboard/admin/countries/_id/details";

const details: CountryDetailsLabels = {
  title: "تفاصيل الدولة",
  backButtonTooltip: "العودة إلى الدول",
  cardTitle: "معلومات عامة",
  idLabel: "معرف الدولة",
  nameLabel: "اسم الدولة",
  actions: {
    edit: "تعديل الدولة",
    delete: "حذف الدولة",
  },
  alerts: {
    loadFailed: "فشل في تحميل تفاصيل الدولة.",
    notFound: "الدولة غير موجودة.",
    deleteSuccess: "تم حذف الدولة بنجاح.",
    deleteError: "فشل في حذف الدولة.",
    checkError: "فشل في التحقق من مواقع الدولة.",
    cannotDelete: "لا يمكن حذف الدولة لوجود مواقع مرتبطة بها.",
  },
  deleteDialog: {
    title: "حذف الدولة",
    description: "هل أنت متأكد من رغبتك في حذف هذه الدولة؟ لا يمكن التراجع عن هذا الإجراء.",
    notice: "ملاحظة: يمكنك فقط حذف الدول التي لا تحتوي على أي مواقع مرتبطة.",
    cancel: "إلغاء",
    confirm: "حذف",
  },
};

export default details;
