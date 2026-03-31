"use client";

import React, { useState } from "react";

export default function PersonalInfoForm({ fullData }: { readonly fullData: any }) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    
    const target = e.target as typeof e.target & {
      firstName: { value: string };
      lastName: { value: string };
      phone: { value: string };
    };

    // دمج التعديلات الجديدة مع الداتا القديمة (عشان الباك إند ميمسحش الباقي)
    const updatedPayload = {
      firstName: target.firstName.value,
      lastName: target.lastName.value,
      phone: target.phone.value,
      dateOfBirth: fullData.dateOfBirth, // بنبعت القديم زي ما هو
      address: fullData.address, 
      emergencyContact: fullData.emergencyContact,
      languagePreference: fullData.languagePreference,
      currencyPreference: fullData.currencyPreference
    };

    try {
      const response = await fetch(`/api/users/${fullData.userId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) throw new Error("Failed to update");
      setSuccessMsg("Personal information updated successfully.");
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 border-b border-slate-100 pb-4 text-xl font-bold text-slate-900 transition-colors duration-300 dark:border-slate-800 dark:text-white">
        Personal Information
      </h2>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">First Name</label>
            <input type="text" id="firstName" defaultValue={fullData?.firstName || ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Last Name</label>
            <input type="text" id="lastName" defaultValue={fullData?.lastName || ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <input type="email" id="email" defaultValue={fullData?.email || ""} disabled className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/30 dark:text-slate-400" />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
            <input type="tel" id="phone" defaultValue={fullData?.phone || ""} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {successMsg ? (
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{successMsg}</p>
          ) : errorMsg ? (
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{errorMsg}</p>
          ) : <div />}
          
          <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}