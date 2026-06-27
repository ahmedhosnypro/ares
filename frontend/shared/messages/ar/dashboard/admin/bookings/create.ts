import type { CreateBookingLabels } from "../../../../types/dashboard/admin/bookings/create";

const createBooking: CreateBookingLabels = {
  title: "إنشاء حجز",
  subtitle: "إعداد حجز جديد لصالح أحد العملاء.",
  buttons: {
    create: "إنشاء حجز",
  },
  steps: {
    customer: {
      title: "العميل",
      subtitle: "ابحث واختر العميل لهذا الحجز",
      label: "العميل",
      placeholder: "البحث بالاسم أو البريد الإلكتروني أو الهاتف...",
      minCharacters: "اكتب 3 أحرف على الأقل للبحث عن العملاء.",
      noOptions: "لم يتم العثور على عملاء.",
      unnamed: "عميل غير مسمى",
      noEmail: "لا يوجد بريد",
      noPhone: "لا يوجد هاتف",
    },
    info: {
      title: "معلومات الحجز",
      subtitle: "التواريخ وتفاصيل الاستلام / التسليم",
      pickupDate: "تاريخ الاستلام",
      returnDate: "تاريخ الإرجاع",
      pickupLocation: "موقع الاستلام",
      dropoffLocation: "موقع التسليم",
      pickupLocationPlaceholder: "البحث عن موقع الاستلام...",
      dropoffLocationPlaceholder: "البحث عن موقع التسليم...",
      noLocations: "لم يتم العثور على مواقع.",
      returnDateError: "يجب أن يكون تاريخ الإرجاع بعد تاريخ الاستلام",
    },
    vehicle: {
      title: "المركبة",
      subtitleActive: "يتم عرض المركبات المتاحة فقط للتواريخ والموقع المحددين",
      subtitleInactive: "اختر موقع استلام أولاً لتصفح المركبات المتاحة",
      label: "المركبة",
      placeholder: "البحث عن طريق الشركة المصنعة أو الطراز أو اللوحة...",
      noLocationSelected: "يرجى تحديد موقع الاستلام أولاً.",
      noVehiclesFound: "لم يتم العثور على مركبات متاحة للموقع والتواريخ المحددة.",
      unnamed: "غير مسمى",
      noPlate: "بدون لوحة",
      dailyRate: "{rate}/يوم",
      change: "تغيير",
    },
    payment: {
      title: "طريقة الدفع",
      subtitle: "اختر كيف سيدفع العميل مقابل هذا الحجز",
      cash: {
        title: "الدفع النقدي",
        description: "تأكيد الحجز فوراً. يدفع العميل نقداً عند الاستئجار.",
      },
      online: {
        title: "الدفع الإلكتروني",
        description: "إعادة التوجيه إلى الدفع الإلكتروني. يتم حجز المركبة لمدة 10 دقائق حتى يتم الدفع.",
      },
    },
  },
  summary: {
    title: "ملخص التسعير",
    dailyRate: "السعر اليومي",
    totalDays: "إجمالي الأيام",
    totalDaysPlural: "{count} {count, plural, one {يوم} other {أيام}}",
    totalPrice: "السعر الإجمالي",
    noticeLive: "يتم تحديث الأسعار مباشرة أثناء تغيير المركبة والتواريخ.",
    noticeConfirm: "يؤكد الخادم المبلغ النهائي عند الحفظ.",
    noticeFlow: "يتم تحصيل المدفوعات من خلال تدفق منفصل — إنشاء حجز لا يتطلب إكمال الدفع.",
  },
};

export default createBooking;
