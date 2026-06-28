import type { CustomerBookingsLabels } from "../../types/customer/bookings";

const bookings: CustomerBookingsLabels = {
  title: "حجوزاتي",
  description: "تتبع وإدارة ومراجعة جميع حجوزات تأجير السيارات الخاصة بك في مكان واحد.",
  signInRequired: {
    title: "تسجيل الدخول مطلوب",
    message: "يرجى تسجيل الدخول لعرض حجوزاتك.",
    signInButton: "تسجيل الدخول",
  },
  resumeBooking: {
    title: "لديك حجز غير مكتمل",
    message: "أكمل من حيث توقفت مع {vehicle}",
    vehicleHeld: "مركبتك قيد الحجز.",
    resume: "متابعة",
    cancel: "تجاهل",
  },
  filters: {
    searchPlaceholder: "ابحث عن السيارات أو المواقع...",
    filterByStatus: "تصفية حسب الحالة:",
    all: "الكل",
    sortBy: "ترتيب حسب:",
    sortOptions: {
      dateDesc: "التاريخ: الأحدث أولاً",
      dateAsc: "التاريخ: الأقدم أولاً",
      priceAsc: "السعر: من الأقل للأعلى",
      priceDesc: "السعر: من الأعلى للأقل",
      statusAsc: "الحالة: من أ إلى ي",
      statusDesc: "الحالة: من ي إلى أ",
    },
  },
  list: {
    loading: "جارٍ تحميل حجوزاتك...",
    error: "فشل تحميل الحجوزات. يرجى المحاولة مرة أخرى.",
    firstTripTitle: "هل أنت مستعد لرحلتك الأولى؟",
    firstTripMessage: "لم تقم بأي حجوزات بعد. تصفح مجموعتنا المميزة من المركبات وابدأ رحلتك اليوم.",
    noMatches: "لا توجد نتائج مطابقة",
    noMatchesHint: "حاول تعديل الفلاتر أو البحث عن شيء آخر.",
    retry: "إعادة المحاولة",
    pagination: {
      showing: "عرض",
      of: "من",
      bookings: "حجز",
    },
    empty: {
      title: "لا توجد حجوزات بعد",
      message: "سيظهر سجل حجزك هنا بمجرد إجراء حجز.",
      browse: "تصفح المركبات",
    },
    status: {
      draft: "مسودة",
      pending: "معلق",
      confirmed: "مؤكد",
      active: "نشط",
      completed: "مكتمل",
      cancelled: "ملغى",
    },
    actions: {
      view: "عرض التفاصيل",
      cancel: "إلغاء الحجز",
      extend: "تمديد الرحلة",
    },
  },
  card: {
    unknownCar: "سيارة غير معروفة",
    unknownSupplier: "مورّد غير معروف",
    totalLabel: "السعر الإجمالي",
    carImageAlt: "صورة السيارة",
    pickup: "الاستلام",
    dropoff: "التسليم",
    viewDetails: "عرض التفاصيل",
    details: "التفاصيل",
    notAvailable: "غير متوفر",
  },
};

export default bookings;
