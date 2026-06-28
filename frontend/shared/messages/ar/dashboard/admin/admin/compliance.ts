import type { AdminComplianceLabels } from "../../../../types/dashboard/admin/admin/compliance";

const compliance: AdminComplianceLabels = {
  title: "مركز الامتثال لمعايير PCI DSS",
  subtitle: "إدارة تقييمات الأمان، وفحص الثغرات الأمنية، وتقارير التدقيق",
  statusSection: {
    overallStatus: "حالة الامتثال العامة",
    compliant: "ممتثل",
    nonCompliant: "غير ممتثل",
    score: "درجة الامتثال",
    lastAssessment: "آخر تقييم",
  },
  saqSection: {
    title: "استبيان التقييم الذاتي (SAQ-D)",
    progress: "تقدم استكمال الاستبيان",
    questionsRemaining: "{count} سؤال متبقي",
    continueButton: "متابعة الاستبيان",
    tabTitle: "متطلبات استبيان التقييم الذاتي D لمعايير PCI DSS",
    requirementSubtitle: "المتطلبات 3 و 4",
    inProgress: "قيد التنفيذ",
    tableHeaderId: "المعرف",
    tableHeaderDescription: "وصف المتطلب",
    req3_1: {
      desc: "حماية بيانات حاملي البطاقات المخزنة (CHD) وتقييد وقت التخزين والاحتفاظ بها.",
    },
    req3_4: {
      desc: "جعل رقم الحساب الأساسي (PAN) غير قابل للقراءة في أي مكان يتم تخزينه فيه (على سبيل المثال، باستخدام تشفير قوي).",
    },
    req4_1: {
      desc: "استخدام تشفير قوي وبروتوكولات أمان لحماية بيانات حاملي البطاقات الحساسة (CHD) أثناء نقلها.",
    },
    req6_2: {
      desc: "التأكد من حماية جميع مكونات النظام والبرامج من الثغرات الأمنية المعروفة عن طريق تثبيت تحديثات الأمان.",
    },
  },
  scansSection: {
    title: "عمليات فحص الثغرات",
    lastScan: "آخر فحص",
    passed: "ناجح",
    failed: "فاشل",
    findings: "النتائج",
    highSeverity: "خطورة عالية",
    mediumSeverity: "خطورة متوسطة",
    lowSeverity: "خطورة منخفضة",
    runScanButton: "تشغيل فحص الثغرات",
    scanSuccessAlert:
      "تم الانتهاء من فحص الثغرات الأمنية بنجاح. الحالة: ممتثل. تم العثور على 0 ثغرات أمنية ذات خطورة عالية.",
    recentLogsTitle: "سجلات الفحص الأخيرة",
    refreshButton: "تحديث الفحوصات",
    tableHeaderDate: "تاريخ الفحص",
    tableHeaderTarget: "الهدف / النطاق",
    log1: {
      date: "24 يونيو 2026",
      target: "واجهة برمجة تطبيقات الدفع لبوابة Ares والويب",
      findings: "0 حرجة، 0 عالية، 2 متوسطة، 5 منخفضة",
    },
    log2: {
      date: "10 مايو 2026",
      target: "قاعدة بيانات Ares ومجموعة الخدمات الخلفية",
      findings: "0 حرجة، 0 عالية، 0 متوسطة، 2 منخفضة",
    },
    log3: {
      date: "15 أبريل 2026",
      target: "نطاق الشبكة الخارجية (ares-rental.com)",
      findings: "0 حرجة، 1 عالية (تم إصلاحها)، 4 متوسطة",
    },
    scanningBackdropText: "جاري فحص النظام بحثاً عن ثغرات أمنية...",
  },
  penTestSection: {
    title: "اختبار الاختراق",
    lastTest: "آخر اختبار",
    status: "الحالة",
    active: "نشط / آمن",
    scheduleButton: "جدولة اختبار الاختراق",
  },
  reportsSection: {
    title: "تقارير الامتثال",
    generateButton: "توليد تقرير",
    downloadRoC: "تحميل تقرير الامتثال (RoC)",
    downloadAoC: "تحميل إقرار الامتثال (AoC)",
    generatedReportsTitle: "تقارير الامتثال التي تم إنشاؤها",
    rocDescription: "تقرير الامتثال (RoC) - تقرير التقييم الكامل الموقع من مقيم الأمن المؤهل (QSA).",
    aocDescription: "إقرار الامتثال (AoC) - الملخص الرسمي لحالة الامتثال.",
    downloadPdfButton: "تحميل ملف PDF",
  },
};

export default compliance;
