import React from "react";
import ProfileHeader from "./_components/ProfileHeader";
import PersonalInfoForm from "./_components/PersonalInfoForm";
import AddressForm from "./_components/AddressForm";
import PreferencesSection from "./_components/PreferencesSection";
import VerificationStatus from "./_components/VerificationStatus";

export default async function ProfilePage() {
  const currentUserId = "user-123"; 
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  let profileData = null;

  try {
    const response = await fetch(`${baseUrl}/api/users/${currentUserId}/profile`, {
      cache: 'no-store'
    });
    if (response.ok) {
      profileData = await response.json();
    }
  } catch (error) {
    console.error("Failed to fetch profile:", error);
  }

  const safeData = profileData || {
    userId: currentUserId,
    firstName: "Mohamed",
    lastName: "Elshinawy",
    email: "mohamed@example.com",
    phone: "01000000000",
    profileCompleteness: 75,
    address: {},
    emergencyContact: {},
    verificationStatus: { email: true, phone: false, driverLicense: false }
  };

  return (
    // 1. الديف الأب: واخد خلفية ناعمة جداً للصفحة كلها
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* 2. عنوان الصفحة عشان يدي طابع احترافي */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Manage your personal information, security, and preferences.
          </p>
        </div>

        {/* 3. الجريد: متقسم 12 عمود لمرونة أكتر */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* العمود اللي على الشمال (بياخد 4 أعمدة من الـ 12) */}
          <div className="space-y-6 lg:col-span-4">
            {/* الكروت هنا واخده ستايل موحد: خلفية بيضا، شادو ناعم، وبوردر خفيف */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <ProfileHeader 
                userId={safeData.userId}
                photoUrl={safeData.profilePhotoUrl}
                firstName={safeData.firstName}
                lastName={safeData.lastName}
                email={safeData.email}
                completeness={safeData.profileCompleteness}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <VerificationStatus status={safeData.verificationStatus} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <PreferencesSection fullData={safeData} />
            </div>
          </div>

          {/* العمود اللي على اليمين (بياخد 8 أعمدة من الـ 12 - مساحة أكبر للفورم) */}
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <PersonalInfoForm fullData={safeData} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <AddressForm fullData={safeData} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}