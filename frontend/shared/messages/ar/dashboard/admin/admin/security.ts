import type { AdminSecurityLabels } from "../../../../types/dashboard/admin/admin/security";

const security: AdminSecurityLabels = {
  title: "مراقبة أمن المدفوعات في الوقت الفعلي",
  subtitle: "كشف التسلل، وتدقيق العمليات المباشرة، والتحقق من سلامة الملفات",
  statsSection: {
    securityScore: "درجة الأمان",
    activeThreats: "التهديدات النشطة",
    integrityViolations: "انتهاكات سلامة الملفات",
    auditLogsCount: "السجلات المسجلة (24 ساعة)",
  },
  liveFeedSection: {
    title: "البث المباشر لأمن العمليات",
    time: "الوقت",
    transactionId: "معرف العملية",
    amount: "المبلغ",
    status: "حالة الأمان",
    action: "الإجراء المتخذ",
    safe: "تمت الموافقة",
    flagged: "تحت المراجعة",
    blocked: "محظور",
    liveFeedMonitor: "مراقب البث المباشر",
    times: {
      justNow: "الآن",
      oneMinAgo: "قبل دقيقة",
      minsAgo: "قبل {count} دقائق",
    },
    actions: {
      none: "لا يوجد",
      threeDSecure: "مطلوب التحقق ثلاثي الأبعاد",
      ipBlocked: "تم حظر عنوان IP / درجة الاحتيال 98",
      fraudScoreRejected: "تم الرفض لدرجة الاحتيال",
      reviewTriggered: "تم تفعيل المراجعة",
    },
  },
  intrusionAlertsSection: {
    title: "تنبيهات كشف التسلل",
    noAlerts: "لم يتم كشف أي تنبيهات تسلل في آخر 30 يوماً",
    alertType: "نوع التنبيه",
    severity: "الخطورة",
    description: "الوصف",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
    tableHeaderTimestamp: "الطابع الزمني",
    resolved: "تم الحل",
    alerts: {
      xss: {
        time: "23 يونيو 2026 14:22",
        type: "تم حظر محاولة XSS",
        desc: "تم تعقيم مدخلات البرمجة عبر المواقع (XSS) في صفحة الدفع (/checkout/[id])",
      },
      rateLimit: {
        time: "19 يونيو 2026 09:12",
        type: "تجاوز حد معدل الطلبات",
        desc: "تجاوز عنوان IP 192.168.1.104 حد معدل استدعاءات API على نقطة نهاية تسجيل الدخول للتحقق",
      },
    },
  },
  fileIntegritySection: {
    title: "مراقب سلامة الملفات",
    status: "حالة مراقبة السلامة",
    healthy: "سليم",
    lastChecked: "آخر فحص: قبل 5 دقائق",
    fileChanges: "تغييرات الملفات المكتشفة",
    viewDetailsButton: "عرض التفاصيل",
    tableHeaderPath: "المسار المراقب",
    tableHeaderHash: "تجزئة الملف (SHA-256)",
    tableHeaderModified: "آخر تعديل",
    unchanged: "غير معدل",
    files: {
      nextConfig: {
        modified: "26 يونيو 2026 12:00",
      },
      packageJson: {
        modified: "25 يونيو 2026 18:30",
      },
      envProd: {
        modified: "14 يونيو 2026 09:15",
      },
    },
  },
};

export default security;
