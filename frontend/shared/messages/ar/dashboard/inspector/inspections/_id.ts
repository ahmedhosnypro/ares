import type { InspectionDetailLabels } from "../../../../types/dashboard/inspector/inspections/_id";

export const inspectionDetail: InspectionDetailLabels = {
  pageTitle: "تقرير الفحص",
  subtitle: "مراجعة التفاصيل وتقديم تقرير للحجز #{bookingNumber}",
  errors: {
    accessDenied: "ليس لديك صلاحية الوصول إلى هذا الفحص.",
    notFound: "الفحص غير موجود.",
    loadFailed: "فشل في تحميل تفاصيل الفحص.",
    notFoundShort: "غير موجود",
  },
  goBack: "العودة",
  lockedAlert: "تم تقديم تقرير هذا الفحص وهو مقفل للتعديل.",
  bookingInfo: {
    title: "التفاصيل",
    bookingNumber: "رقم الحجز",
    vehicle: "المركبة",
    assignedTo: "المفتش المعين",
    scheduledDate: "التاريخ المجدول",
    submittedAt: "تاريخ التقديم",
  },
  vehicleMetrics: {
    title: "مقاييس المركبة",
    odometerReading: "قراءة العداد",
    odometerPlaceholder: "مثال: 45000",
    odometerUnit: "كم",
    fuelLevel: "مستوى الوقود: {level}%",
    fuelMarksE: "ف",
    fuelMarksHalf: "1/2",
    fuelMarksF: "م",
  },
  images: {
    title: "الأدلة المرئية ({current}/{max})",
    uploadButton: "رفع صور",
    noPhotosProvided: "لم يتم تقديم صور",
    uploadPrompt: "رفع صور الفحص",
    dragDropHint: "اسحب وأفلت أو انقر للتصفح (الحد الأدنى {min}, الحد الأقصى {max})",
    altText: "فحص",
    maxImagesError: "الحد الأقصى {max} صور مسموح بها",
    minImagesError: "مطلوب صورة واحدة على الأقل",
  },
  conditions: {
    title: "الحالة والملاحظات",
    generalConditionLabel: "تقرير الأضرار / الحالة العامة (اختياري)",
    generalConditionPlaceholder: "اذكر أي أضرار مرئية أو خدوش أو ملاحظات حول الحالة العامة...",
    notesLabel: "ملاحظات الفحص النهائية (مطلوب)",
    notesPlaceholder: "ملاحظات تفصيلية لدعم قرارك النهائي...",
  },
  decision: {
    title: "القرار النهائي",
    approve: "قبول المركبة",
    reject: "رفض المركبة",
    selectDecisionError: "يرجى اختيار قرار (قبول أو رفض)",
  },
  validation: {
    notesRequired: "يرجى تقديم ملاحظات الفحص",
    odometerInvalid: "يرجى إدخال قراءة عداد صالحة",
  },
  dialog: {
    title: "تقديم تقرير الفحص؟",
    description:
      "أنت على وشك تحديد حالة هذه المركبة كـ <strong>{decision}</strong>. هذا الإجراء نهائي وسيتم إبلاغ الأطراف المعنية.",
    confirmAndSubmit: "تأكيد وتقديم",
  },
  submitButton: "تقديم التقرير النهائي",
  toast: {
    submittedSuccessfully: "تم تقديم الفحص بنجاح",
    submissionFailed: "فشل التقديم. يرجى المحاولة مرة أخرى.",
  },
};
