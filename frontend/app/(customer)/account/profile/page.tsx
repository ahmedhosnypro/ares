import { Metadata } from "next";
import { notFound } from "next/navigation";

// Import Utils
import { fetchData } from "@/src/utils/api-client";

// Import Components
import ProfileHeader from "./_components/ProfileHeader";
import PersonalInfoForm from "./_components/PersonalInfoForm";
import AddressForm from "./_components/AddressForm";
import VerificationStatus from "./_components/VerificationStatus";
import PreferencesSection from "./_components/PreferencesSection";

export const metadata: Metadata = {
  title: "My Profile | Account",
  description: "Manage your personal information, security, and preferences.",
};

// تعريف شكل البيانات اللي جاية من الـ API (ده اللي كان ضايع مننا)
interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  phoneVerified: boolean;
  dateOfBirth: string;
  profilePhotoUrl: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  languagePreference: string;
  currencyPreference: string;
  profileCompleteness: number;
  verificationStatus: {
    email: boolean;
    phone: boolean;
    driverLicense: boolean;
    kyc: "none" | "basic" | "standard" | "enhanced";
  };
}

export default async function ProfilePage() {
  let profile: UserProfile;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    
    // ملاحظة: هنا بنفترض إنك بتجيب الـ userId من الـ Session أو الـ Token
    const currentUserId = "123-uuid-placeholder";
    
    profile = await fetchData<UserProfile>(`${baseUrl}/api/users/${currentUserId}/profile`);
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    notFound(); // لو مفيش داتا، وديه لصفحة 404
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* عنوان الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Account Settings</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your profile details, security preferences, and account verification.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-8 lg:grid-cols-12 lg:gap-x-10">
          
          {/* LEFT COLUMN - 8 Columns */}
          <div className="lg:col-span-8 space-y-8">
            {/* كارت البيانات الشخصية */}
            <section className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <PersonalInfoForm initialData={profile} />
            </section>

            {/* كارت العنوان والطوارئ */}
            <section className="rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-shadow hover:shadow-md">
              <AddressForm
                address={profile.address}
                emergencyContact={profile.emergencyContact}
              />
            </section>
          </div>

          {/* RIGHT COLUMN - 4 Columns */}
          <div className="lg:col-span-4">
            <aside className="sticky top-8 space-y-6">
              
              {/* كارت الصورة الشخصية ونسبة الاكتمال */}
              <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
                <ProfileHeader
                  photoUrl={profile.profilePhotoUrl}
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  email={profile.email}
                  completeness={profile.profileCompleteness}
                />
              </div>

              {/* كارت حالة التوثيق (Verification) */}
              <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
                <VerificationStatus status={profile.verificationStatus} />
              </div>

              {/* كارت التفضيلات (اللغة والعملة) */}
              <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
                <PreferencesSection
                  language={profile.languagePreference}
                  currency={profile.currencyPreference}
                />
              </div>

            </aside>
          </div>

        </div>
      </div>
    </main>
  );
}