import type { AdminVehiclesMgmtLabels } from "../../../../types/dashboard/admin/admin/vehicles";

const vehicles: AdminVehiclesMgmtLabels = {
  title: "إدارة أسطول المركبات",
  subtitle: "مراقبة الحالة التشغيلية، وعرض مقاييس الأداء، وإجراء العمليات الجماعية على أسطول المركبات.",
  stats: {
    totalAssets: "إجمالي أصول الأسطول",
    available: "المركبات المتاحة",
    inMaintenance: "قيد الصيانة",
    outOfService: "خارج الخدمة",
  },
  actions: {
    editStatus: "تحديث الحالة",
    statusHistory: "عرض السجل",
    importCsv: "استيراد CSV",
    exportData: "تصدير الأسطول",
    bulkAction: "إجراء جماعي",
  },
  table: {
    vehicle: "معلومات المركبة",
    category: "الفئة",
    location: "الموقع",
    status: "الحالة",
    action: "الإجراءات",
    empty: "لم يتم العثور على مركبات في الأسطول.",
    searchPlaceholder: "البحث برقم اللوحة أو الاسم...",
    allStatuses: "جميع الحالات",
    allCategories: "جميع الفئات",
  },
  statusDialog: {
    title: "تحديث الحالة التشغيلية",
    selectStatus: "اختر الحالة",
    reason: "سبب تغيير الحالة",
    expectedReturn: "تاريخ العودة المتوقع",
    cancel: "إلغاء",
    save: "حفظ التغييرات",
    successAlert: "تم تحديث حالة المركبة بنجاح.",
  },
  historyDialog: {
    title: "سجل حالة المركبة",
    date: "تاريخ التغيير",
    statusChange: "انتقال الحالة",
    reason: "السبب",
    user: "بواسطة",
    close: "إغلاق",
    empty: "لم يتم تسجيل أي تغييرات في الحالة.",
  },
  bulkDialog: {
    title: "إجراء عملية جماعية",
    selectAction: "اختر الإجراء",
    updatePricing: "تحديث مقاييس التسعير",
    changeStatus: "تغيير حالة العناصر المحددة",
    assignLocation: "إعادة التعيين إلى موقع",
    updateAvailability: "تعيين حالة التوفر",
    apply: "تطبيق على المحدد",
    cancel: "إلغاء",
    successAlert: "تم تطبيق العملية الجماعية بنجاح على {count} من المركبات.",
    affectingCount: "يؤثر حالياً على {count} من المركبات المحددة.",
    changeStatusMaintenance: "تغيير حالة العناصر المحددة (← صيانة)",
  },
  statuses: {
    active: "نشط",
    maintenance: "صيانة",
    outOfService: "خارج الخدمة",
  },
  alerts: {
    importSuccess: "تم استيراد الأسطول بنجاح من ملف CSV.",
    exportSuccess: "تم تحميل بيانات أسطول المركبات بنجاح.",
  },
};

export default vehicles;
