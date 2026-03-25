import React from "react";

// حلينا مشكلة الـ Read-only props للينتر
interface VerificationStatusProps {
  readonly status?: {
    readonly email: boolean;
    readonly phone: boolean;
    readonly driverLicense: boolean;
    readonly kyc: "none" | "basic" | "standard" | "enhanced";
  };
}

// ⚠️ الحل العبقري لإيرور (Cannot create components during render)
// خلينا الـ Item ده كومبوننت منفصل بره الدالة الأساسية
function VerificationItem({ label, isVerified, actionText }: { label: string; isVerified: boolean; actionText: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${isVerified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {isVerified ? "✓" : "!"}
        </div>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      {!isVerified && (
        <button className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors">
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
      <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-100 pb-2">
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