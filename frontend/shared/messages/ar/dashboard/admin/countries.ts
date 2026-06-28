import type { CountriesLabels } from "../../../types/dashboard/admin/countries";

const countries: CountriesLabels = {
  title: "الدول",
  subtitle: "إدارة الدول المتاحة للمواقع",
  addCountry: "إضافة دولة",
  stats: {
    totalCountries: "إجمالي الدول",
    activeRegions: "المناطق النشطة",
    activeRegionsDesc: "تقريب لأن الدول مشتقة من المواقع النشطة",
  },
  searchPlaceholder: "البحث عن دولة بالاسم...",
  table: {
    headers: {
      countryName: "اسم الدولة",
      actions: "الإجراءات",
    },
    empty: "لم يتم العثور على دول",
    showing: "عرض <strong>{count}</strong> من أصل {total} من الدول",
  },
  actions: {
    delete: "حذف الدولة",
  },
  deleteDialog: {
    title: "حذف الدولة",
    description: "هل أنت متأكد من أنك تريد حذف هذه الدولة؟",
    notice: "لا يمكن التراجع عن هذا الإجراء.",
    cancel: "إلغاء",
    confirm: "حذف",
  },
  alerts: {
    deleteSuccess: "تم حذف الدولة بنجاح.",
    deleteError: "فشل في حذف الدولة.",
    checkError: "فشل في التحقق من حالة الدولة.",
    cannotDelete: "لا يمكن حذف هذه الدولة لأنها تحتوي على مواقع.",
  },
};

export default countries;
