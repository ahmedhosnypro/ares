"use client";

import React, { useState } from "react";

interface AddressFormProps {
  readonly address?: {
    readonly street?: string;
    readonly city?: string;
    readonly state?: string;
    readonly postalCode?: string;
    readonly country?: string;
  };
  readonly emergencyContact?: {
    readonly name?: string;
    readonly phone?: string;
    readonly relationship?: string;
  };
}

export default function AddressForm({ address, emergencyContact }: AddressFormProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault();
    setLoading(true);
    // محاكاة حفظ البيانات
    await new Promise((resolve) => { setTimeout(resolve, 1000); });
    setLoading(false);
  };

  // حلينا مشكلة Unnecessary optional chain (اللي ظهرتلك في الهيستوري) بإننا نعمل Optional Chaining بأمان
  const safeAddress = address || {};
  const safeContact = emergencyContact || {};

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
        Address & Emergency Contact
      </h2>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-8">
        
        {/* قسم العنوان */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="street" className="block text-sm font-bold text-slate-700 mb-2">Street Address</label>
            <input
              type="text"
              id="street"
              defaultValue={safeAddress.street || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-bold text-slate-700 mb-2">City</label>
            <input
              type="text"
              id="city"
              defaultValue={safeAddress.city || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-bold text-slate-700 mb-2">Country</label>
            <input
              type="text"
              id="country"
              defaultValue={safeAddress.country || ""}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* قسم جهة اتصال الطوارئ */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="contactName" className="block text-sm font-bold text-slate-700 mb-2">Contact Name</label>
              <input
                type="text"
                id="contactName"
                defaultValue={safeContact.name || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                id="contactPhone"
                defaultValue={safeContact.phone || ""}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Address"}
          </button>
        </div>
      </form>
    </div>
  );
}