import type { BookingPaymentLabels } from "../../types/customer/booking-payment";

const bookingPayment: BookingPaymentLabels = {
  title: "إكمال الحجز",
  subtitle: "معالجة الدفع بشكل آمن لتأكيد حجزك.",
  stepper: {
    payment: "الدفع",
  },
  error: {
    verificationRequired: {
      title: "التحقق مطلوب",
    },
    bookingStatusChanged: {
      title: "تم تغيير حالة الحجز",
      message: "هذا الحجز لم يعد قيد التنفيذ. يرجى التحقق من تفاصيل حجزك.",
    },
    vehicleUnavailable: {
      title: "المركبة غير متاحة",
    },
    generic: {
      message: "حدث خطأ غير متوقع. يرجى المحاولة لاحقًا.",
    },
  },
  actions: {
    viewBooking: "عرض الحجز",
    completeVerification: "إكمال التحقق",
    returnHome: "العودة إلى الرئيسية",
    restartBooking: "إعادة الحجز",
  },
  hold: {
    expired: {
      title: "انتهت فترة حجز المركبة",
      message: "انتهت المهلة لإتمام الدفع. يرجى بدء حجز جديد.",
    },
    active: {
      title: "حجز المركبة قائم",
      message: "أكمل الدفع قبل انتهاء فترة الحجز.",
      remaining: "متبقي",
    },
  },
  payment: {
    failed: {
      title: "فشل الدفع",
      message: "لم تنجح محاولة الدفع السابقة. يرجى المحاولة مرة أخرى.",
    },
  },
  form: {
    securePayment: "الدفع الآمن",
    loading: "جاري تحميل نموذج الدفع الآمن\u2026",
    iframeTitle: "الدفع الآمن",
    initiationFailed: "فشل بدء الدفع",
    loadFailed: "فشل تحميل نموذج الدفع",
  },
  express: {
    title: "الدفع السريع",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    pay: "ادفع",
    or: "أو",
  },
  orderSummary: {
    premiumClass: "فئة مميزة",
    suppliedBy: "مقدمة من {supplier}",
    pickup: "الاستلام",
    return: "الإرجاع",
    price: {
      rental: "إيجار {count} {unit}",
      day: "يوم",
      days: "أيام",
      discount: "الخصم",
      totalAmount: "المبلغ الإجمالي",
    },
  },
};

export default bookingPayment;
