import type { AdminDriversLabels } from "../../../types/dashboard/admin/drivers";

const drivers: AdminDriversLabels = {
  title: "إدارة السائقين",
  subtitle: "مراجعة مستندات السائقين والتحقق منها وقبول الطلبات أو رفضها وتفعيل الحسابات أو تعطيلها.",
  tabs: {
    allDrivers: "جميع السائقين",
    pendingVerification: "قيد التحقق",
  },
  searchPlaceholder: "البحث بالاسم أو البريد الإلكتروني أو الهاتف",
  status: "الحالة",
  errorLoad: "تعذر تحميل بيانات السائقين.",
  noDrivers: "لم يتم العثور على سائقين",
  filters: {
    reset: "إعادة تعيين",
  },
  table: {
    driver: "السائق",
    email: "البريد الإلكتروني",
    status: "الحالة",
    availability: "التوفر",
    rating: "التقييم",
    active: "نشط",
    actions: "الإجراءات",
    view: "عرض",
    viewLicense: "عرض الرخصة",
    verifyStatus: "التحقق من الحالة",
    toggleStatus: "تبديل الحالة",
    activeStatus: "نشط",
    disabledStatus: "معطل",
  },
  statuses: {
    all: "الكل",
    incomplete: "غير مكتمل",
    pendingVerification: "قيد التحقق",
    verified: "تم التحقق",
    rejected: "مرفوض",
    suspended: "موقوف",
  },
};

export default drivers;
