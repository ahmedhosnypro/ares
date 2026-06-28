import type { CategoryDetailsLabels } from "../../../../types/dashboard/admin/categories/detail";

const categoryDetails: CategoryDetailsLabels = {
  backToCategories: "العودة إلى الفئات",
  statusActive: "نشط",
  statusInactive: "غير نشط",
  stats: {
    totalVehicles: "إجمالي المركبات",
    totalBookings: "إجمالي الحجوزات",
    revenue: "الإيرادات",
  },
  vehiclesTable: {
    title: "المركبات في الفئة",
    headers: {
      makeModel: "الماركة والموديل",
      licensePlate: "لوحة الترخيص",
      actions: "الإجراءات",
    },
    viewButton: "عرض",
    empty: "لا توجد مركبات مخصصة لهذه الفئة.",
  },
  promotions: {
    title: "العروض الترويجية",
    activeScheduled: "النشطة والمجدولة",
    addBtn: "إضافة",
    percentOff: "% خصم",
    deleteConfirm: "هل أنت متأكد من رغبتك في حذف هذا العرض الترويجي؟",
    empty: "لم يتم العثور على عروض ترويجية.",
    alerts: {
      deleteSuccess: "تم حذف العرض الترويجي.",
      deleteError: "فشل حذف العرض الترويجي.",
      saveSuccess: "تم حفظ العرض الترويجي بنجاح.",
      saveError: "فشل حفظ العرض الترويجي.",
      loadError: "فشل تحميل العروض الترويجية.",
      requiredFields: "يرجى تعبئة الحقول المطلوبة بشكل صحيح.",
      dateOrderError: "يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.",
    },
    form: {
      addTitle: "إضافة عرض ترويجي",
      editTitle: "تعديل العرض الترويجي",
      name: "اسم العرض الترويجي",
      discount: "الخصم",
      startDate: "تاريخ البدء",
      endDate: "تاريخ الانتهاء",
      status: "الحالة",
      statusOptions: {
        active: "نشط",
        inactive: "غير نشط",
        expired: "منتهي الصلاحية",
      },
    },
  },
  errors: {
    notFound: "الفئة غير موجودة.",
    loadError: "فشل تحميل تفاصيل الفئة.",
  },
};

export default categoryDetails;
