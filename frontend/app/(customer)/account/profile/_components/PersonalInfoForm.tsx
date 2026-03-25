"use client";

import React, { useState } from "react";

// حلينا مشكلة prefer-read-only-props بإضافة readonly
interface PersonalInfoFormProps {
  readonly initialData: {
    readonly userId: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
    readonly dateOfBirth: string;
  };
}

export default function PersonalInfoForm({ initialData }: PersonalInfoFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // استخدمنا SyntheticEvent بدل FormEvent عشان نحل إيرور الـ Deprecation
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    
    try {
      // هنا المفروض هتربط مع الـ API بتاع التعديل (PUT request)
      await new Promise((resolve) => { setTimeout(resolve, 1000); }); // محاكاة للتحميل
      setSuccessMsg("Personal information updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
        Personal Information
      </h2>

      {/* حلينا مشكلة no-misused-promises باستخدام void */}
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
            <input
              type="text"
              id="firstName"
              defaultValue={initialData?.firstName || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
            <input
              type="text"
              id="lastName"
              defaultValue={initialData?.lastName || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              defaultValue={initialData?.email || ""}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
            <input
              type="tel"
              id="phone"
              defaultValue={initialData?.phone || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          {successMsg ? (
            <p className="text-sm font-bold text-emerald-600">{successMsg}</p>
          ) : (
            <div></div> // مساحة فاضية عشان الزرار يفضل على اليمين
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}