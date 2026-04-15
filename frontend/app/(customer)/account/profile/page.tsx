import ProfileHeader from "./_components/ProfileHeader";
import PersonalInfoForm from "./_components/PersonalInfoForm";
import AddressForm from "./_components/AddressForm";
import PreferencesSection from "./_components/PreferencesSection";
import VerificationStatus from "./_components/VerificationStatus";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { toApiUrl } from "@/src/utils/api-client";
import { type ProfileData } from "./types";
import { logger } from "@/src/utils/logger";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id || !session.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in required</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Please sign in to access your account settings.</p>
          </div>
        </div>
      </div>
    );
  }

  let profileData: ProfileData | null = null;

  try {
    const response = await fetch(toApiUrl(`/api/users/${session.user.id}/profile`), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
    if (response.ok) {
      profileData = (await response.json()) as ProfileData;
    }
  } catch (error) {
    logger.error("Fetch profile data error", error);
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950 md:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Unable to load profile</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">Please try again in a moment.</p>
          </div>
        </div>
      </div>
    );
  }

  const safeData = profileData;

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
                accessToken={session.accessToken}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <VerificationStatus status={safeData.verificationStatus} />
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <PreferencesSection fullData={safeData} accessToken={session.accessToken} />
            </div>
          </div>

          {/* العمود اللي على اليمين (بياخد 8 أعمدة من الـ 12 - مساحة أكبر للفورم) */}
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <PersonalInfoForm fullData={safeData} accessToken={session.accessToken} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <AddressForm fullData={safeData} accessToken={session.accessToken} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
