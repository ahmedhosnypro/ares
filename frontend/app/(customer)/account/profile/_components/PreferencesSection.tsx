"use client";

import React from "react";

interface PreferencesSectionProps {
  readonly language?: string;
  readonly currency?: string;
}

export default function PreferencesSection({ language, currency }: PreferencesSectionProps) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-black text-slate-900 mb-4 border-b border-slate-100 pb-2">
        Preferences
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Language
          </label>
          <select 
            defaultValue={language || "en"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="en">English (US)</option>
            <option value="ar">Arabic (EG)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Currency
          </label>
          <select 
            defaultValue={currency || "USD"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="USD">USD ($)</option>
            <option value="EGP">EGP (E£)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
    </div>
  );
}