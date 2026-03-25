import React from "react";

// ظبطنا الأسماء هنا عشان تماتش اللي راجع من الـ API بالظبط
interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ReviewSection({ reviews }: Readonly<{ reviews?: Review[] }>) {
  // أمان تام: لو مفيش تقييمات، اعتبرها مصفوفة فاضية
  const safeReviews = reviews || [];

  return (
    <div className="flex flex-col">
      {/* Header Area */}
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Reviews</h3>
        
        {/* شارة بتعرض عدد التقييمات لو موجودة */}
        {safeReviews.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {safeReviews.length} {safeReviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {safeReviews.length > 0 ? (
          safeReviews.map((review) => (
            // كارت الريفيو
            <div 
              key={review._id} // اتعدلت لـ _id
              className="group rounded-2xl bg-slate-50 p-6 transition-colors hover:bg-slate-100/80"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                
                <div className="flex items-center gap-4">
                  {/* الأفاتار (أول حرف من اسم اليوزر) */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                    {/* اتعدلت لـ userName */}
                    {review.userName ? review.userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  
                  <div>
                    {/* اتعدلت لـ userName */}
                    <h4 className="font-bold text-slate-900">{review.userName}</h4>
                    {/* النجوم بتنسيق احترافي */}
                    <div className="mt-1 flex text-sm">
                      <span className="text-amber-400">{"★".repeat(review.rating)}</span>
                      <span className="text-slate-300">{"★".repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                </div>

                {/* التاريخ */}
                <span className="text-sm font-medium text-slate-400 sm:text-right">
                  {review.date}
                </span>
              </div>

              {/* التعليق */}
              <p className="text-slate-600 leading-relaxed sm:pl-16">
                {review.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <span className="text-4xl mb-3">💬</span>
            <h4 className="text-base font-bold text-slate-900">No reviews yet</h4>
            <p className="mt-1 text-sm text-slate-500">Be the first to rent and review this vehicle!</p>
          </div>
        )}
      </div>
    </div>
  );
}