"use client";

import { toApiUrl } from "@/src/utils/api-client";
import { type ProfileData } from "../types";
import { logger } from "@/src/utils/logger";

export default function PreferencesSection({
  fullData,
  accessToken,
}: {
  readonly fullData: ProfileData;
  readonly accessToken: string;
}) {
  const handlePreferenceChange = async (field: "languagePreference" | "currencyPreference", value: string) => {
    const updatedPayload = {
      firstName: fullData.firstName,
      lastName: fullData.lastName,
      phone: fullData.phone,
      dateOfBirth: fullData.dateOfBirth,
      address: fullData.address,
      emergencyContact: fullData.emergencyContact,
      languagePreference: field === "languagePreference" ? value : fullData.languagePreference,
      currencyPreference: field === "currencyPreference" ? value : fullData.currencyPreference,
    };

    try {
      await fetch(toApiUrl(`/api/users/${fullData.userId}/profile`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updatedPayload),
      });
    } catch (error) {
      logger.error("Update preference error", error);
    }
  };

  return (
    <div className="p-6">
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
        Preferences
      </h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Language
          </label>
          <select
            defaultValue={fullData.languagePreference || "en"}
            onChange={e => {
              void handlePreferenceChange("languagePreference", e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
          >
            <option value="en" className="dark:bg-slate-800">
              English (US)
            </option>
            <option value="ar" className="dark:bg-slate-800">
              Arabic (EG)
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Currency
          </label>
          <select
            defaultValue={fullData.currencyPreference || "USD"}
            onChange={e => {
              void handlePreferenceChange("currencyPreference", e.target.value);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
          >
            <option value="USD" className="dark:bg-slate-800">
              USD ($)
            </option>
            <option value="EGP" className="dark:bg-slate-800">
              EGP (E£)
            </option>
            <option value="EUR" className="dark:bg-slate-800">
              EUR (€)
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}
