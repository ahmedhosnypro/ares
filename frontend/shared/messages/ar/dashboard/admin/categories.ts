import type { CategoriesLabels } from "../../../types/dashboard/admin/categories";

const categories: CategoriesLabels = {
  title: "الفئات",
  addCategory: "إضافة فئة",
  editCategory: "تعديل الفئة",
  table: {
    headers: {
      name: "الاسم",
      commission: "العمولة",
      vehicles: "المركبات",
      offer: "العرض",
      status: "الحالة",
      actions: "الإجراءات",
    },
    empty: "لم يتم العثور على فئات.",
    offerNone: "لا يوجد",
    offerValue: "خصم {discount}%",
    statusActive: "نشط",
    statusInactive: "غير نشط",
  },
  actions: {
    edit: "تعديل",
    delete: "حذف",
    deleteConfirm: "هل أنت متأكد من رغبتك في حذف هذه الفئة؟",
  },
  alerts: {
    deleteSuccess: "تم حذف الفئة بنجاح.",
    deleteError: "فشل حذف الفئة.",
    deleteHasVehiclesError: "لا يمكن حذف فئة تحتوي على مركبات.",
    saveSuccess: "تم حفظ الفئة بنجاح.",
    loadError: "فشل تحميل الفئات. يرجى المحاولة مرة أخرى لاحقاً.",
  },
  form: {
    addTitle: "إضافة فئة",
    editTitle: "تعديل الفئة",
    fields: {
      name: "الاسم",
      description: "الوصف",
      commission: "نسبة العمولة",
      status: "الحالة",
      offerTitle: "العرض الترويجي (اختياري)",
      offerName: "اسم العرض",
      discount: "نسبة الخصم",
      startDate: "تاريخ البدء",
      endDate: "تاريخ الانتهاء",
      offerStatus: "حالة العرض",
      offerActive: "عرض نشط",
      offerInactive: "عرض غير نشط",
    },
    validation: {
      nameRequired: "الاسم مطلوب.",
    },
    errors: {
      saveFailed: "فشل حفظ الفئة. يرجى المحاولة مرة أخرى.",
    },
  },
};

export default categories;
