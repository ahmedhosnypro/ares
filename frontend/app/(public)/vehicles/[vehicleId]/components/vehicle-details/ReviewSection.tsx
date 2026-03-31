import React from "react";

interface Review {
  _id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ReviewSection({ reviews }: Readonly<{ reviews?: Review[] }>) {
  const safeReviews = reviews || [];

  return (
    <div className="flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 transition-colors duration-300 dark:text-white">User Reviews</h3>
        {safeReviews.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
            {safeReviews.length} {safeReviews.length === 1 ? 'Review' : 'Reviews'}
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        {safeReviews.length > 0 ? (
          safeReviews.map((review) => (
            <div 
              key={review._id} 
              className="group rounded-2xl bg-slate-50 p-6 transition-colors duration-300 hover:bg-slate-100/80 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
            >
              <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                    {review.userName ? review.userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 transition-colors duration-300 dark:text-slate-200">{review.userName}</h4>
                    <div className="mt-1 flex text-sm">
                      <span className="text-amber-400">{"★".repeat(review.rating)}</span>
                      <span className="text-slate-300 dark:text-slate-600">{"★".repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400 transition-colors duration-300 dark:text-slate-500 sm:text-right">
                  {review.date}
                </span>
              </div>
              <p className="leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-400 sm:pl-16">
                {review.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="mb-3 text-4xl">💬</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-200">No reviews yet</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Be the first to rent and review this vehicle!</p>
          </div>
        )}
      </div>
    </div>
  );
}