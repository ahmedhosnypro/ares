"use client";

import React, { useState } from "react";
import { toApiUrl } from "@/src/utils/api-client";
import { type ProfileData } from "../types";
import { logger } from "@/src/utils/logger";

export default function PersonalInfoForm({
  fullData,
  accessToken,
}: {
  readonly fullData: ProfileData;
  readonly accessToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get("firstName") as string | null) ?? "";
    const lastName = (formData.get("lastName") as string | null) ?? "";
    const phone = (formData.get("phone") as string | null) ?? "";

    // دمج التعديلات الجديدة مع الداتا القديمة (عشان الباك إند ميمسحش الباقي)
    const updatedPayload = {
      firstName,
      lastName,
      phone,
      dateOfBirth: fullData.dateOfBirth, // بنبعت القديم زي ما هو
      address: fullData.address,
      emergencyContact: fullData.emergencyContact,
      languagePreference: fullData.languagePreference,
      currencyPreference: fullData.currencyPreference,
    };

    try {
      const response = await fetch(toApiUrl(`/api/users/${fullData.userId}/profile`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedPayload),
      });

      if (!response.ok) throw new Error("Failed to update");
      setSuccessMsg("Personal information updated successfully.");
    } catch (error) {
      logger.error("Update profile error", error);
      setErrorMsg("Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (successMsg) {
      return <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{successMsg}</p>;
    }
    if (errorMsg) {
      return <p className="text-sm font-bold text-red-600 dark:text-red-400">{errorMsg}</p>;
    }
    return <div />;
  };

  return (
    <div>
      <h2 className="mb-6 border-b border-slate-100 pb-4 text-xl font-bold text-slate-900 transition-colors duration-300 dark:border-slate-800 dark:text-white">
        Personal Information
      </h2>

      <form
        onSubmit={e => {
          void handleSubmit(e);
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              defaultValue={fullData.firstName || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              defaultValue={fullData.lastName || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={fullData.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/30 dark:text-slate-400"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={fullData.phone || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {renderStatus()}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
