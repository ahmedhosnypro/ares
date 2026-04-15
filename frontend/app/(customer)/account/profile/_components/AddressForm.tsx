"use client";

import React, { useState } from "react";
import { toApiUrl } from "@/src/utils/api-client";
import { type ProfileData } from "../types";
import { logger } from "@/src/utils/logger";

export default function AddressForm({
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
    const street = (formData.get("street") as string | null) ?? "";
    const city = (formData.get("city") as string | null) ?? "";
    const country = (formData.get("country") as string | null) ?? "";
    const contactName = (formData.get("contactName") as string | null) ?? "";
    const contactPhone = (formData.get("contactPhone") as string | null) ?? "";

    // نجهز العنوان وجهة الاتصال الجديدة ودمجهم مع الداتا القديمة
    const updatedPayload = {
      firstName: fullData.firstName,
      lastName: fullData.lastName,
      phone: fullData.phone,
      dateOfBirth: fullData.dateOfBirth,
      languagePreference: fullData.languagePreference,
      currencyPreference: fullData.currencyPreference,
      address: {
        ...fullData.address,
        street,
        city,
        country,
      },
      emergencyContact: {
        ...fullData.emergencyContact,
        name: contactName,
        phone: contactPhone,
      },
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

      if (response.ok) {
        setSuccessMsg("Address saved successfully!");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      logger.error("Address update error", error);
      setErrorMsg("Failed to save address.");
    } finally {
      setLoading(false);
    }
  };

  const safeAddress = fullData.address || {};
  const safeContact = fullData.emergencyContact || {};

  const renderStatus = () => {
    if (successMsg) return <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{successMsg}</p>;
    if (errorMsg) return <p className="text-sm font-bold text-red-600 dark:text-red-400">{errorMsg}</p>;
    return <div />;
  };

  return (
    <div>
      <h2 className="mb-6 border-b border-slate-100 pb-4 text-xl font-bold text-slate-900 dark:border-slate-800 dark:text-white">
        Address & Emergency Contact
      </h2>

      <form
        onSubmit={e => {
          void handleSubmit(e);
        }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="street" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Street Address
            </label>
            <input
              type="text"
              id="street"
              name="street"
              defaultValue={safeAddress.street || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              City
            </label>
            <input
              type="text"
              id="city"
              name="city"
              defaultValue={safeAddress.city || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="country" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
              Country
            </label>
            <input
              type="text"
              id="country"
              name="country"
              defaultValue={safeAddress.country || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">Emergency Contact</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contactName" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Contact Name
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                defaultValue={safeContact.name || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="contactPhone" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                defaultValue={safeContact.phone || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
          {renderStatus()}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-indigo-600 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
          >
            {loading ? "Saving..." : "Save Address"}
          </button>
        </div>
      </form>
    </div>
  );
}
