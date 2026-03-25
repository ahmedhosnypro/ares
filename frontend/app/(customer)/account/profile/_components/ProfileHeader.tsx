import React from "react";

interface ProfileHeaderProps {
  readonly photoUrl?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly completeness: number;
}

export default function ProfileHeader({
  photoUrl,
  firstName,
  lastName,
  email,
  completeness,
}: ProfileHeaderProps) {
  // حماية للبيانات لو مجاتش
  const safeName = firstName || lastName ? `${firstName} ${lastName}`.trim() : "Valued Customer";
  const safeEmail = email || "No email provided";
  const progress = completeness || 0;

  return (
    <div className="p-6 text-center">
      {/* الصورة الشخصية */}
      <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-indigo-50 bg-slate-100">
        {photoUrl ? (
          <img src={photoUrl} alt={safeName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-2xl font-black text-indigo-600">
            {firstName ? firstName.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>

      <h2 className="text-xl font-black text-slate-900">{safeName}</h2>
      <p className="text-sm font-medium text-slate-500 mb-6">{safeEmail}</p>

      {/* شريط نسبة اكتمال الحساب */}
      <div className="text-left">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile Completion</span>
          <span className="text-xs font-black text-indigo-600">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}