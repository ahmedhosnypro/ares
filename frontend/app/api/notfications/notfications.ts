const BASE_URL = "http://localhost:5000";

/**
 * جلب جميع التنبيهات للمستخدم المصادق عليه
 */
export const getNotifications = async (token: string) => {
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json', // يفضل استخدام json بدل text/plain إذا كان السيرفر يدعم ذلك
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Fetch Notifications Error:", errorText); 
    throw new Error(`Failed to fetch: ${res.status}`);
  }

  return res.json();
};

/**
 * تحديث حالة التنبيه إلى "مقروء"
 */
export const markNotificationAsRead = async (id: string, token: string) => {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    // بعض السيرفرات تتطلب إرسال body فارغ في طلبات PUT
    body: JSON.stringify({}), 
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Mark As Read Error:", errorText);
    throw new Error(`Failed to mark as read: ${res.status}`);
  }

  // ملاحظة: إذا كان السيرفر يعيد استجابة فارغة (204 No Content)، 
  // فإن res.json() قد تسبب خطأ. يفضل التأكد من حالة الاستجابة:
  return res.status === 204 ? { success: true } : res.json();
};

/**
 * جلب عداد التنبيهات غير المقروءة (موجود في الصورة الثالثة)
 */
export const getNotificationCount = async (userId: string, token: string) => {
  const res = await fetch(`${BASE_URL}/api/notification-counter/${userId}`, {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error("Failed to get notification count");
  return res.json();
};

/**
 * إنشاء تنبيهات تجريبية للمستخدم (للاختبار)
 */
export const seedNotifications = async (token: string) => {
  const res = await fetch(`${BASE_URL}/api/notifications/seed`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to seed notifications: ${res.status}`);
  }

  return res.json();
};