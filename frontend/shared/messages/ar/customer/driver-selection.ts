import type { DriverSelectionLabels } from "../../types/customer/driver-selection";

const driverSelection: DriverSelectionLabels = {
  title: "اختر وضع القيادة",
  subtitle: "{vehicleLabel} · {pickupDate} إلى {returnDate}",
  stepper: {
    step1: "المركبة",
    step2: "السائق",
    step3: "الدفع",
    step4: "التأكيد",
  },
  licenseRequired:
    "ليس لديك رخصة قيادة معتمدة في الملف، لذا يلزم سائق لهذا الحجز. يمكنك إضافة رخصة من ملفك الشخصي لفتح خيار القيادة الذاتية.",
  error: "غير قادر على تحميل السائقين الآن. يرجى المحاولة مرة أخرى.",
  errorSaveSelection: "فشل حفظ اختيارك. يرجى المحاولة مرة أخرى.",
  errorChangeMode: "فشل تغيير الوضع. يرجى المحاولة مرة أخرى.",
  intentLost: {
    goBack: "العودة",
    message: "لم نتمكن من العثور على تفاصيل حجزك. ربما انتهت صلاحية جلستك أو المركبة لم تعد متاحة.",
  },
  modes: {
    selfDrive: {
      title: "القيادة الذاتية",
      description: "قم بقيادة المركبة بنفسك. يتطلب رخصة قيادة مُعتمدة.",
    },
    withDriver: {
      title: "طلب سائق",
      description: "اختر سائقًا مُعتمدًا ليقود لك. يطبق رسوم السائق.",
    },
  },
  drivers: {
    title: "السائقون المتاحون",
    unavailable: "{count} آخرون في هذه المنطقة مشغولون أو غير متاحين حاليًا",
    noDrivers: "لا توجد سائقين متاحين",
    noDriversMessage: "لا توجد سائقين مُعتمدون متاحون لهذه التواريخ الآن. يرجى تجربة تواريخ مختلفة أو العودة لاحقًا.",
    experience: "الخبرة",
    driverFee: "رسوم السائق",
    selected: "محدد",
    unselect: "انقر مرة أخرى لإلغاء التحديد",
    trips: "رحلات",
    newDriver: "جديد",
  },
  actions: {
    back: "رجوع",
    continue: "متابعة",
    continuePayment: "المتابعة إلى الدفع",
  },
};

export default driverSelection;
