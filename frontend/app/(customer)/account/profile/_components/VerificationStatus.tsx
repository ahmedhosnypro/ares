
interface VerificationStatusProps {
  readonly status?: {
    readonly email: boolean;
    readonly phone: boolean;
    readonly driverLicense: boolean;
    readonly kyc: "none" | "basic" | "standard" | "enhanced";
  };
}

// الكومبوننت المنفصل بعد إضافة الدارك مود وتأثيرات الانتقال
function VerificationItem({ label, isVerified, actionText }: { label: string; isVerified: boolean; actionText: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-50 py-3 transition-colors duration-300 last:border-0 dark:border-slate-800/50">
      <div className="flex items-center gap-3">
        {/* أيقونة الحالة: أخضر لو متوثق، أصفر/برتقالي لو لأ */}
        <div 
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors duration-300 ${
            isVerified 
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          }`}
        >
          {isVerified ? "✓" : "!"}
        </div>
        <span className="text-sm font-bold text-slate-700 transition-colors duration-300 dark:text-slate-300">
          {label}
        </span>
      </div>
      
      {/* زرار الأكشن بيظهر بس لو الحساب مش متوثق */}
      {!isVerified && (
        <button className="text-xs font-black text-indigo-600 transition-colors duration-300 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
          {actionText}
        </button>
      )}
    </div>
  );
}

export default function VerificationStatus({ status }: VerificationStatusProps) {
  const safeStatus = status || { email: false, phone: false, driverLicense: false, kyc: "none" };

  return (
    <div className="p-6">
      {/* العنوان والخط الفاصل */}
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-lg font-black text-slate-900 transition-colors duration-300 dark:border-slate-800 dark:text-white">
        Verification Status
      </h3>
      
      <div className="flex flex-col">
        <VerificationItem 
          label="Email Address" 
          isVerified={safeStatus.email} 
          actionText="Verify" 
        />
        <VerificationItem 
          label="Phone Number" 
          isVerified={safeStatus.phone} 
          actionText="Verify" 
        />
        <VerificationItem 
          label="Driver's License" 
          isVerified={safeStatus.driverLicense} 
          actionText="Upload" 
        />
      </div>
    </div>
  );
}